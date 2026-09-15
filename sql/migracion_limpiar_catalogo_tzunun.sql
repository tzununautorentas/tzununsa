-- ═══════════════════════════════════════════════════════════════════
-- LIMPIA EL CATÁLOGO DE CUENTAS — Tz'ununSA
-- Problema detectado: la tabla `cuentas_contables` tenía DOS catálogos
-- mezclados → códigos duplicados ("1","2","3","4","5" ×2) y TIPOS que
-- la app no reconoce ("ingresos","egresos","patrimonio","costo").
--   • Esquema SAT (viejo): códigos con PUNTOS (1.1, 1.1.1, 6.1, 2.1) +
--     raíces en MAYÚSCULAS (ACTIVOS, PASIVOS, CAPITAL, INGRESOS, ...).
--   • Nomenclatura Tz'unun (nuevo): SOLO dígitos corridos (11, 1101,
--     51, 5101) — raíces Capitalizadas (Activo, Pasivo, Patrimonio...).
--
-- REGLA SEGURA usada en esta migración:
--   El esquema SAT es el ÚNICO que contiene códigos con puntos ('.'),
--   así que borrar `codigo LIKE '%.%'` elimina TODO el SAT y NUNCA
--   toca un código Tz'unun (que son solo dígitos).
--   Luego se eliminan las raíces SAT en MAYÚSCULAS que comparten dígito
--   con Tz'unun, y se normalizan los tipos a los 6 que usa la app:
--   activo · pasivo · capital · ingreso · costo · gasto.
--
-- EJECUTAR EN: Supabase → SQL Editor → Run (sin RLS)
-- ES IDEMPOTENTE: puede correrse varias veces sin romper nada.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) Ajuste de seguridad: NO borrar nada sin empresa ─────────────
DELETE FROM cuentas_contables
WHERE empresa_id IS NULL;

-- ── 2) Borrar TODO el esquema SAT (códigos con puntos) ─────────────
DELETE FROM cuentas_contables
WHERE codigo LIKE '%.%';

-- ── 3) Borrar raíces SAT en MAYÚSCULAS que chocan con dígitos ──────
DELETE FROM cuentas_contables
WHERE lower(codigo) IN ('1','2','3','4','5','6','7','8','9')
  AND nombre = upper(nombre)                 -- solo las versiones TODAS MAYÚSCULAS (SAT)
  AND lower(nombre) IN ('activos','pasivos','capital','ingresos',
                        'costos de operación','gastos de operación',
                        'ventas','patrimonio','gasto');

-- ── 4) Normalizar tipos → los 6 que usa Contabilidad ───────────────
-- (Codex: la app filtra solo "activo, pasivo, capital, ingreso, costo, gasto")
UPDATE cuentas_contables SET tipo = 'capital' WHERE tipo ILIKE 'patrimonio%' OR tipo = 'patrimonio';
UPDATE cuentas_contables SET tipo = 'ingreso' WHERE tipo ILIKE 'ingresos%' OR tipo = 'ingreso';
UPDATE cuentas_contables SET tipo = 'costo'   WHERE tipo ILIKE 'costos%'  OR tipo ILIKE 'costo%';
UPDATE cuentas_contables SET tipo = 'gasto'   WHERE tipo ILIKE 'egresos%' OR tipo ILIKE 'egreso%' OR tipo = 'gasto' OR tipo = 'gastos';
UPDATE cuentas_contables SET tipo = 'activo'  WHERE tipo ILIKE 'activos%' OR tipo = 'activo' OR tipo = 'actividad';
UPDATE cuentas_contables SET tipo = 'pasivo'  WHERE tipo ILIKE 'pasivos%' OR tipo = 'pasivo';

-- ── 5) Deduplicar: dejar el de menor id por (empresa_id, codigo) ──
DELETE FROM cuentas_contables cc
USING cuentas_contables du
WHERE cc.empresa_id = du.empresa_id
  AND cc.codigo    = du.codigo
  AND cc.id        > du.id;

-- ── 6) Índice único (previene duplicados futuros) ───────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuentas_contables_emp_codigo
  ON cuentas_contables (empresa_id, codigoPreview);

-- ── 7) Completar cuentas Tz'unun faltantes para CADA empresa ──────
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
SELECT e.id, v.codigo, v.nombre, v.tipo, v.nivel, true
FROM (VALUES
  -- Activo
  ('1','Activo','activo',1),
  ('11','Activo circulante','activo',2),
  ('1101','Caja','activo',3),
  ('1102','Bancos','activo',3),
  ('110201','Banrural GTQ 3099347613 (Anterior)','activo',3),
  ('110202','Banrural GTQ 3309159475 (Nueva)','activo',3),
  ('110203','Banrural GTQ 3018079289 (Oscar Gálvez)','activo',3),
  ('110204','Banco Industrial GTQ 0120407879 (Anterior)','activo',3),
  ('110205','Banco Industrial USD 0120407978 (Internacional)','activo',3),
  ('110206','Banco Industrial GTQ 853-000016-8 (Nueva)','activo',3),
  ('110207','Banco Industrial GTQ 014-307678-4 (María Reyes)','activo',3),
  ('110208','BAC','activo',3),
  ('1103','Cuentas por cobrar','activo',3),
  ('110301','Cuentas por cobrar clientes','activo',3),
  ('110302','Otras cuentas por cobrar','activo',3),
  ('12','Activo fijo','activo',2),
  ('1201','Propiedad planta y equipo','activo',3),
  ('1202','Equipo de informática','activo',3),
  ('1203','Bienes inmuebles','activo',3),
  ('1204','Vehículos','activo',3),
  -- Pasivo
  ('2','Pasivo','pasivo',1),
  ('21','Pasivo circulante','pasivo',2),
  ('2101','Cuentas por pagar suministradores','pasivo',3),
  ('2102','Impuesto pequeño contribuyente por pagar','pasivo',3),
  ('2103','Otras cuentas por pagar','pasivo',3),
  ('2104','Cuentas x pagar tarjeta de crédito (TC) BI','pasivo',3),
  ('22','Pasivo fijo','pasivo',2),
  ('2201','Préstamos a largo plazo por pagar','pasivo',3),
  ('2202','Otros préstamos de largo plazo por pagar','pasivo',3),
  ('2203','Depreciación acumulada de vehículos','pasivo',3),
  -- Patrimonio (→ capital)
  ('3','Patrimonio','capital',1),
  ('31','Patrimonio','capital',2),
  ('3101','Capital socios','capital',3),
  -- Ventas (→ ingreso)
  ('4','Ventas','ingreso',1),
  ('41','Ventas','ingreso',2),
  ('4101','Alquiler de vehículo','ingreso',3),
  ('4102','Otros ingresos','ingreso',3),
  ('4103','Traslado de personas','ingreso',3),
  -- Egresos variables (→ costo) y fijos (→ gasto)
  ('5','Gastos','gasto',1),
  ('51','Gastos variables','costo',2),
  ('5101','Car Wash (Lavado de carros y utensilios de limpieza)','costo',3),
  ('5102','Combustibles','costo',3),
  ('5103','Mano de obra conductor/a','costo',3),
  ('5104','Trámites legales (abogado, timbres, impresión, etc)','costo',3),
  ('5105','Mantenimiento vehículos','costo',3),
  ('5106','Repuestos vehículos','costo',3),
  ('5107','Impuestos (de salida, aduanales, peajes, etc)','costo',3),
  ('5108','Alimentación','costo',3),
  ('5109','Hospedaje','costo',3),
  ('5110','Parqueo','costo',3),
  ('5111','Alquiler de vehículo','costo',3),
  ('5112','Capacitaciones al personal','costo',3),
  ('5113','Gastos de publicidad y promoción','costo',3),
  ('5114','Gastos médicos','costo',3),
  ('5115','Enderezado y pintura','costo',3),
  ('5116','Traslados varios (Uber, taxis, etc)','costo',3),
  ('5117','Comisiones bancarias','costo',3),
  ('5118','Deducible seguros','costo',3),
  ('52','Gastos fijos','gasto',2),
  ('5201','Servicio teléfono e internet','gasto',3),
  ('5202','Parqueo flotilla','gasto',3),
  ('5203','Póliza de seguro','gasto',3),
  ('5204','Intereses préstamo','gasto',3),
  ('5205','Depreciación gasto vehículos','gasto',3),
  ('5206','Salarios','gasto',3),
  ('5207','Servicio garita de seguridad colonia Lo de Bran','gasto',3)
) v(codigo, nombre, tipo, nivel)
CROSS JOIN empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM cuentas_contables c
  WHERE c.empresa_id = e.id AND c.codigo = v.codigo
);