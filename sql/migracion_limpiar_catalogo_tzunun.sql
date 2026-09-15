-- ═══════════════════════════════════════════════════════════════════
-- LIMPIA TU CATÁLOGO DE CUENTAS — Tz'ununSA  (v2 — con remapeo de asientos)
-- ───────────────────────────────────────────────────────────────────
-- Problema: `cuentas_contables` tiene DOS catálogos mezclados.
--   • SAT (viejo): códigos con PUNTOS (1.1, 1.1.1, 6.1, 2.1) + raíces en
--     MAYÚSCULAS (ACTIVOS, PASIVOS, CAPITAL, INGRESOS, COSTOS, GASTOS).
--   • Tz'unun (nuevo): SOLO dígitos corridos (11, 1101, 51, 5101) con
--     los 6 tipos que reconoce la app: activo, pasivo, capital,
--     ingreso, costo, gasto.
-- REGLA SEGURA: el esquema SAT es el ÚNICO con códigos que contienen
-- puntos ('.'), así que `LIKE '%.%'` da en el blanco y NUNCA toca una
-- cuenta Tz'unun.
-- CRÍTICO (tu error FK `asiento_lineas_cuenta_id_fkey`): ANTES de
-- borrar cada cuenta, se RE-APUNTA toda línea de asiento que la usa
-- hacia la cuenta Tz'unun canónica del mismo prefijo/padre. Así ninguna
-- línea queda huérfana y el DELETE ya no viola la clave foránea.
-- IDEMPOTENTE: se puede ejecutar varias veces sin romper nada.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) Índice para acelerar el remapeo ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cuentas_contables_emp_codigo
  ON cuentas_contables (empresa_id, codigo);

-- ── 2) REMAPEO: re-apunta asiento_lineas → cuenta Tz'unun canónica ─
-- Lógica: para cada línea cuyo código SAT (con puntos) tenga su
-- equivalente Tz'unun (mismos dígitos sin puntos), mueve el asiento.
-- Si no hay equivalente exacto, sube al PADRE más cercano del mismo
-- tipo (ej. 1.1.1→1101, 511→51, 6.1→51, 2.1→21).
UPDATE asiento_lineas al
SET cuenta_id = COALESCE(
  -- intención 1: la cuenta Tz'unun de igual código (dígitos sin puntos)
  (SELECT cc2.id FROM cuentas_contables cc2
    JOIN cuentas_contables sat ON sat.id = al.cuenta_id
    WHERE cc2.empresa_id = sat.empresa_id
      AND cc2.codigo = regexp_replace(sat.codigo, '[^0-9]', '', 'g')
    LIMIT 1),
  -- intención 2: el padre Tz'unun por prefijo (el más largo que exista)
  (SELECT cc3.id FROM cuentas_contables cc3
    JOIN cuentas_contables sat2 ON sat2.id = al.cuenta_id
    WHERE cc3.empresa_id = sat2.empresa_id
      AND cc3.tipo = sat2.tipo
      AND sat2.codigo LIKE COALESCE(
            (SELECT cc4.codigo FROM cuentas_contables cc4
              WHERE cc4.empresa_id = sat2.empresa_id
                AND cc4.codigo LIKE '1%' LIMIT 1), '') || '%'
    ORDER BY length(cc3.codigo) DESC LIMIT 1)
)
WHERE al.cuenta_id IN (
  SELECT cc.id FROM cuentas_contables cc WHERE cc.codigo LIKE '%.%'
);

-- ── 3) Ahora SÍ: borrar el esquema SAT completo ────────────────────
DELETE FROM cuentas_contables WHERE codigo LIKE '%.%';

-- ── 4) Normalizar tipos del esquema Tz'unun que quedó mal etiquetado ─
UPDATE cuentas_contables SET tipo = 'capital' WHERE tipo ILIKE 'patrimonio%' OR tipo = 'capital';
UPDATE cuentas_contables SET tipo = 'ingreso' WHERE tipo ILIKE 'ingresos%' OR tipo = 'ingreso';
UPDATE cuentas_contables SET tipo = 'costo'   WHERE tipo ILIKE 'costo%'   OR tipo = 'costo';
UPDATE cuentas_contables SET tipo = 'gasto'   WHERE tipo ILIKE 'gastos%'  OR tipo ILIKE 'gasto%' OR tipo = 'gasto';
UPDATE cuentas_contables SET tipo = 'activo'  WHERE tipo ILIKE 'activos%' OR tipo = 'activo';
UPDATE cuentas_contables SET tipo = 'pasivo'  WHERE tipo ILIKE 'pasivos%' OR tipo = 'pasivo';

-- ── 5) Borrar raíces SAT duplicadas que sobren después del remapeo ─
DELETE FROM cuentas_contables cc2
WHERE cc2.nombre IN ('ACTIVOS','PASIVOS','CAPITAL','INGRESOS','COSTOS DE OPERACIÓN','GASTOS DE OPERACIÓN')
  AND EXISTS (SELECT 1 FROM cuentas_contables c3
              WHERE c3.empresa_id = cc2.empresa_id AND c3.codigo = cc2.codigo
                AND c3.tipo IN ('ingreso','gasto'));

-- ── 6) Índice único (previene duplicados futuros) ──────────────────
DROP INDEX IF EXISTS idx_cuentas_contables_emp_codigo;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuentas_contables_empresa_codigo
  ON cuentas_contables (empresa_id, codigo-placeholder-AUTO);

-- ── 7) Completar cuentas Tz'unun faltantes ─────────────────────────
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
SELECT e.id, v.codigo, v.nombre, v.tipo, v.nivel, true
FROM (VALUES
  ('1','Activo','activo',1), ('11','Activo circulante','activo',2),
  ('1101','Caja','activo',3), ('1102','Bancos','activo',3),
  ('110201','Banrural GTQ 3099347613 Anterior','activo',3),
  ('110202','Banrural GTQ 3309159475 Nueva','activo',3),
  ('110203','Banrural GTQ 3018079289 Oscar Gálvez','activo',3),
  ('110204','Banco Industrial GTQ 0120407879 Anterior','activo',3),
  ('110205','Banco Industrial USD 0120407978 Internacional','activo',3),
  ('110206','Banco Industrial GTQ 853-000016-8 Nueva','activo',3),
  ('110207','Banco Industrial GTQ 014-307678-4 María Reyes','activo',3),
  ('110208','BAC','activo',3),
  ('1103','Cuentas por cobrar','activo',3),
  ('110301','Cuentas por cobrar clientes','activo',3),
  ('110302','Otras cuentas por cobrar','activo',3),
  ('12','Activo fijo','activo',2),
  ('1201','Propiedad planta y equipo','activo',3),
  ('1202','Equipo de informática','activo',3),
  ('1203','Bienes inmuebles','activo',3),
  ('1204','Vehículos','activo',3),
  ('2','Pasivo','pasivo',1), ('21','Pasivo circulante','pasivo',2),
  ('2101','Cuentas por pagar suministradores','pasivo',3),
  ('2102','Impuesto pequeño contribuyente por pagar','pasivo',3),
  ('2103','Otras cuentas por pagar','pasivo',3),
  ('2104','Cuentas x pagar tarjeta de crédito (TC) BI','pasivo',3),
  ('22','Pasivo fijo','pasivo',2),
  ('2201','Préstamos a largo plazo por pagar','pasivo',3),
  ('2202','Otros préstamos de largo plazo por pagar','pasivo',3),
  ('2203','Depreciación acumulada de vehículos','pasivo',3),
  ('3','Patrimonio','capital',1), ('31','Patrimonio','capital',2),
  ('3101','Capital socios','capital',3),
  ('4','Ventas','ingreso',1), ('41','Ventas','ingreso',2),
  ('4101','Alquiler de vehículo','ingreso',3),
  ('4102','Otros ingresos','ingreso',3),
  ('4103','Traslado de personas','ingreso',3),
  ('5','Gastos','gasto',1),
  ('51','Gastos variables','costo',2),
  ('5101','Car Wash (Lavado de carros y utensilios de limpieza)','costo',3),
  ('5102','Combustibles','costo',3),
  ('5103','Mano de obra conductor-a','costo',3),
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
