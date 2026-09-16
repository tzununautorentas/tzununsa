# FASE 3.2 — Plan de implementación (esquema GRUPO A: 3.2A, 3.2B, 3.2C, 3.2D)

Proyecto: ERP Tz'unun · Supabase `fmijbpatkddkbxlkfoza`
Estado: **EN REVISIÓN — pendiente aprobación del usuario. NO EJECUTAR.**

---

## 0. Alcance

- **Primera fase que modifica la base de datos de Supabase.**
- Todo el contenido es **GRUPO A** (determinista, seguro, sin interpretación de datos).
- Base de diseño: `FASE3A1_INFORME_TECNICO.md` (secciones 2, 5, 7, 8, 11 — versión corregida).
- **NO** incluye: RLS (FASE 3.6), GRUPO B (3.3/3.4), GRUPO C (3.9), deploy automático.

## 1. Reglas obligatorias de la fase

1. **Backup previo** (datos + esquema): `asientos_contables`, `asiento_lineas`, `facturas`, `cuentas_contables`, `movimientos_bancarios`, `usuarios_sistema`, `roles`, `empresas`. Guardar SQL dump versionado o fuera del repo.
2. **Atomicidad SQL+código:** los cambios de código de 3.2A se commitean junto con el SQL (evita que Gastos/Contabilidad escriban en `modulo_origen` inexistente).
3. **Verificaciones pre-ejecución (SELECCT):** estados únicos, tipo de `roles.id`, existencia previa de columnas, conteos NULL (deben coincidir con el backfill esperado).
4. Sin deploy automático. Sin RLS. Sin cambios GRUPO B/C (FAC-221920, huérfanos, `5.2.1`, `dff6b2e1` — intactos).
5. Rollback documentado por bloque.

## 2. Orden de ejecución

`3.2A → 3.2B → 3.2C → 3.2D`

Cada bloque se verifica (prueba de aceptación) antes de pasar al siguiente.

---

## 3. BLOQUE 3.2A — Estructura contable

Tablas: `asientos_contables`, `asiento_lineas`, `facturas`.

### 3.2A-1. Renombrar columna (SOLO RENAME, sin ADD COLUMN)

> Corrección clave: el SQL previo de FASE 3A (`ADD COLUMN` + `RENAME`) queda **NO APROBADO** porque duplicaba columnas. Este lo reemplaza.

```sql
ALTER TABLE asientos_contables RENAME COLUMN modulo_origen TO origen_tipo;
```

### 3.2A-2. Agregar columnas `evento_tipo` y `estado`

```sql
ALTER TABLE asientos_contables
  ADD COLUMN evento_tipo text,
  ADD COLUMN estado text NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo','anulado','reversado'));
```

### 3.2A-3. Backfill normalizador (sin interpretar datos)

```sql
UPDATE asientos_contables
   SET origen_tipo = COALESCE(origen_tipo, 'manual'),
       evento_tipo = 'manual'
 WHERE origen_tipo IS NULL OR origen_id IS NULL;
```

### 3.2A-4. NOT NULL

```sql
ALTER TABLE asientos_contables
  ALTER COLUMN origen_tipo SET NOT NULL,
  ALTER COLUMN evento_tipo SET NOT NULL;
```

### 3.2A-5. Índice único de idempotencia (parcial)

```sql
CREATE UNIQUE INDEX uq_asientos_identidad
  ON asientos_contables (empresa_id, origen_tipo, origen_id, evento_tipo)
  WHERE estado = 'activo' AND origen_id IS NOT NULL;
```

### 3.2A-6. `asiento_lineas.empresa_id` (backfill + NOT NULL)

```sql
ALTER TABLE asiento_lineas ADD COLUMN empresa_id uuid;
UPDATE asiento_lineas l SET empresa_id = a.empresa_id
  FROM asientos_contables a WHERE a.id = l.asiento_id;
ALTER TABLE asiento_lineas ALTER COLUMN empresa_id SET NOT NULL;
```

### 3.2A-7. Facturas — campos canónicos

```sql
UPDATE facturas SET numero_factura = numero WHERE numero_factura IS NULL;
UPDATE facturas SET nombre_receptor = cliente_nombre, nit_receptor = cliente_nit
 WHERE nombre_receptor IS NULL OR nombre_receptor = '';
```

### 3.2A-8. Código a modificar en el mismo commit

| Archivo | Línea | Cambio |
|---|---|---|
| `src/pages/Contabilidad.jsx` | :130 | `modulo_origen:"manual"` → `origen_tipo:"manual", evento_tipo:"manual", estado:"activo"` |
| `src/pages/Contabilidad.jsx` | :368, :413 | `modulo_origen` → `origen_tipo` (+ `evento_tipo`) |
| `src/pages/Gastos.jsx` | :715 | `modulo_origen:'gastos'` → `origen_tipo:'gasto', evento_tipo:'tesoreria'` |

### 3.2A-9. Prueba de aceptación

1. `SELECT count(*) FROM asiento_lineas WHERE empresa_id IS NULL` → `0`.
2. Índice `uq_asientos_identidad` creado.
3. Contabilidad guarda asiento manual sin error.
4. Gastos guarda asiento de gasto sin error.

### 3.2A-10. Rollback

```sql
DROP INDEX uq_asientos_identidad;
ALTER TABLE asientos_contables DROP COLUMN evento_tipo, DROP COLUMN estado;
ALTER TABLE asientos_contables RENAME COLUMN origen_tipo TO modulo_origen;
ALTER TABLE asiento_lineas DROP COLUMN empresa_id;
```

---

## 4. BLOQUE 3.2B — Esquema multiempresa (tablas/funciones vacías)

### 3.2B-1. Schema `authz`

```sql
CREATE SCHEMA IF NOT EXISTS authz;
```

### 3.2B-2. Tabla `usuario_empresas` (vacía)

```sql
CREATE TABLE IF NOT EXISTS usuario_empresas (
  usuario_id uuid NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id)     ON DELETE RESTRICT,
  rol_id     int  NOT NULL REFERENCES roles(id)        ON DELETE RESTRICT,
  activo     boolean NOT NULL DEFAULT true,
  PRIMARY KEY (usuario_id, empresa_id)
);
CREATE INDEX IF NOT EXISTS idx_ue_empresa ON usuario_empresas (empresa_id);
```

> **Advertencia pre-ejecución:** confirmar que `roles.id` es tipo `int`. Si fuera `uuid`, ajustar los tipos de FK antes de ejecutar.

### 3.2B-3. Índices de unicidad en `usuarios_sistema`

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_us_auth  ON usuarios_sistema (auth_id) WHERE auth_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_us_email ON usuarios_sistema (lower(email)) WHERE email IS NOT NULL;
```

### 3.2B-4. Función `authz.empresas_autorizadas()`

```sql
CREATE OR REPLACE FUNCTION authz.empresas_autorizadas()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  SELECT DISTINCT ue.empresa_id
  FROM public.usuarios_sistema us
  JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
  WHERE us.auth_id = auth.uid() AND us.activo AND ue.activo;
$$;
REVOKE ALL ON FUNCTION authz.empresas_autorizadas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.empresas_autorizadas() TO authenticated;
```

### 3.2B-5. Función `authz.es_super_admin()`

```sql
CREATE OR REPLACE FUNCTION authz.es_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_sistema us
    JOIN public.roles r ON r.id = us.rol_id
    WHERE us.auth_id = auth.uid() AND us.activo
      AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true'));
$$;
REVOKE ALL ON FUNCTION authz.es_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.es_super_admin() TO authenticated;
```

> Sin RLS todavía. Solo esquema (la RLS es FASE 3.6, con puerta dura).

### 3.2B-6. Prueba de aceptación

1. Tablas y funciones existen (`to_regclass`, `to_regprocedure`).
2. Funciones ejecutables por rol `authenticated`.

### 3.2B-7. Rollback

```sql
DROP TABLE usuario_empresas;
DROP FUNCTION authz.empresas_autorizadas();
DROP FUNCTION authz.es_super_admin();
DROP INDEX uq_us_auth;
DROP INDEX uq_us_email;
```

---

## 5. BLOQUE 3.2C — Constraint catálogo híbrido

### 5.1. SQL

```sql
ALTER TABLE cuentas_contables
  ADD CONSTRAINT uq_cuenta_empresa_codigo UNIQUE NULLS NOT DISTINCT (empresa_id, codigo);
```

### 5.2. Semántica confirmada (`NULLS NOT DISTINCT`)

| (empresa_id, codigo) | Permitido |
|---|---|
| `NULL` + `5.2.1` (maestro) | ✓ |
| `EmpresaA` + `5.2.1` | ✓ |
| `EmpresaB` + `5.2.1` | ✓ |
| `EmpresaA` + `5.2.1` (duplicado) | ✗ |

### 5.3. Regla

`5.2.1 CarWash` (empresa `adc5…`) NO se modifica: se conserva como cuenta operativa legítima de Tz'unun (extensión del maestro). No se promueve a maestro ni se borra.

### 5.4. Prueba de aceptación

Insertar/verificar los 4 casos de la tabla.

### 5.5. Rollback

```sql
ALTER TABLE cuentas_contables DROP CONSTRAINT uq_cuenta_empresa_codigo;
```

---

## 6. BLOQUE 3.2D — Estructura bancaria

### 6.1. Columna `estado` en `movimientos_bancarios`

```sql
ALTER TABLE movimientos_bancarios ADD COLUMN estado text NOT NULL DEFAULT 'activo'
  CHECK (estado IN ('activo','anulado'));
```

### 6.2. Función `fn_recalcular_saldo_cuenta()` (esquema)

> EL TRIGGER NO SE ACTIVA EN ESTA FASE. Se activa en FASE 3.8.

```sql
CREATE OR REPLACE FUNCTION fn_recalcular_saldo_cuenta()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  _ids uuid[];
BEGIN
  CASE TG_OP
    WHEN 'INSERT' THEN _ids := ARRAY[NEW.cuenta_id];
    WHEN 'DELETE' THEN _ids := ARRAY[OLD.cuenta_id];
    WHEN 'UPDATE' THEN
      IF coalesce(NEW.cuenta_id::text, '') IS DISTINCT FROM coalesce(OLD.cuenta_id::text, '') THEN
        _ids := ARRAY[OLD.cuenta_id, NEW.cuenta_id];
      ELSE
        _ids := ARRAY[COALESCE(NEW.cuenta_id, OLD.cuenta_id)];
      END IF;
  END CASE;

  PERFORM pg_advisory_xact_lock(hashtext('tz_saldo:' || m.cuenta_id::text))
    FROM (SELECT DISTINCT c FROM unnest(_ids) AS t(c) ORDER BY 1) m;

  UPDATE cuentas_bancarias c
     SET saldo_actual = c.saldo_inicial
       + coalesce((SELECT sum(CASE WHEN mo.tipo='ingreso' THEN mo.monto ELSE -mo.monto END)
                   FROM movimientos_bancarios mo
                   WHERE mo.cuenta_id = c.id AND mo.estado='activo'), 0)
   WHERE c.id = ANY(_ids);

  RETURN COALESCE(NEW, OLD);
END $$;
```

Detalles de diseño:
- **Anulación/reactivación:** cambia `estado` → recalcula filtrando `estado='activo'`.
- **Cambio de cuenta A→B:** recalcula ambas (OLD + NEW).
- **Huérfanos (`cuenta_id NULL`):** lock no-op; el `UPDATE` no matchea → no rompe.
- **Deadlock:** mitigado con `pg_advisory_xact_lock` sobre IDs ordenados + prefijo `tz_saldo:`.

### 6.3. Prueba de aceptación

1. Columna + CHECK creados.
2. Función existe.
3. `INSERT` de movimiento funciona.
4. Saldos **NO** se recalcan aún (trigger pendiente 3.8).

### 6.4. Rollback

```sql
DROP FUNCTION fn_recalcular_saldo_cuenta();
ALTER TABLE movimientos_bancarios DROP COLUMN estado;
```

---

## 7. Verificaciones pre-ejecución (antes de 3.2A)

```sql
-- (SOLO LECTURA) estados múltiples de modulo_origen:
SELECT modulo_origen, count(*) FROM asientos_contables GROUP BY 1;
-- (SOLO LECTURA) tipo de roles.id:
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name = 'roles' AND column_name = 'id';
-- (SOLO LECTURA) existencia de columnas target:
SELECT column_name FROM information_schema.columns
 WHERE table_name IN ('asientos_contables','asiento_lineas','facturas','movimientos_bancarios')
   AND column_name IN ('origen_tipo','evento_tipo','estado','empresa_id','numero_factura');
-- (SOLO LECTURA) conteos NULL que el backfill debe llevar a 0:
SELECT count(*) FROM asiento_lineas;
```

---

## 8. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Deploy no simultáneo SQL+Código (3.2A) — Gastos/Contabilidad escribirían `modulo_origen` inexistente | Commit atómico SQL+repo; sin deploy automático |
| Dup de columnas por rename mal aplicado | SOLO `RENAME`, no `ADD + RENAME` |
| Constraint `NULLS NOT DISTINCT` no soportado | PostgreSQL 15+ (Supabase OK) |
| Deadlock cruzado en recálculo | Locks ordenados + namespace |
| `roles.id` no `int` | Verificación pre-ejecución + ajuste de tipos |
| Regresión de módulos tras commit código | Prueba de humo UI (Contabilidad manual, Gastos, Banca) post-ejecución |

---

## 9. Entregables de la fase

1. SQL ejecutado por bloque + salida capturada (log).
2. Backups pre-ejecución guardados.
3. Código actualizado en el mismo commit (3.2A-8).
4. Pruebas de aceptación por bloque (resultados).
5. Informe `FASE3.2_INFORME.md` con ESTADO final.

---

**ESTADO: PREPARADO PARA REVISIÓN — pendiente aprobación del usuario para ejecutar.**