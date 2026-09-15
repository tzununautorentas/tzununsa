-- ═══════════════════════════════════════════════════════════════════
-- CATÁLOGO CONTABLE DEFINITIVO — Tz'ununSA  (única versión)
-- ───────────────────────────────────────────────────────────────────
-- CÓDIGOS: SIEMPRE con PUNTOS (1, 1.1, 1.1.1, 5.1 … 6.11).
-- Este es el ÚNICO archivo del repo que toca el catálogo. Bórralo
-- con cuidado: ganas (a) eliminar TODA la contabilidad de prueba
-- (asientos del 22-may-2026 y cualquier movimiento de verificación),
-- y (b) reconstruir `cuentas_contables` limpio, puntreado, con los
-- códigos que `Gastos.jsx`, `ImportadorSAT` y `Contabilidad` esperan.
-- IDEMPOTENTE: correlo las veces que quieras.
-- EJECUTAR: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1) LIMPIAR CONTABILIDAD DE PRUEBA (asientos del 22-may-2026 y +) ─
-- Orden correcto para NO violar FK: primero líneas, luego asientos.
DELETE FROM asiento_lineas;
DELETE FROM asientos_contables;

-- ── 2) BORRAR TODO EL CATÁLOGO VIEJO (SAT punteado + dígitos corridos) ─
DELETE FROM cuentas_contables;

-- ── 3) REINSERTAR CATÁLOGO TZ'UNUN — SOLO PUNTOS ─────────────────────
-- Tipos que la app reconoce: activo, pasivo, capital, ingreso, costo, gasto
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
SELECT e.id, v.codigo, v.nombre, v.tipo, v.nivel, true
FROM (
  VALUES
    -- ── 1 · ACTIVO ──
    ('1',    'Activo',                          'activo',  1),
    ('1.1',  'Activo circulante',               'activo',  2),
    ('1.1.1','Caja',                            'activo',  3),
    ('1.1.2','Bancos',                          'activo',  3),
    ('1.1.2.1','Banrural GTQ 3099347613 (Anterior)','activo',4),
    ('1.1.2.2','Banrural GTQ 3309159475 (Nueva)','activo',   4),
    ('1.1.2.3','Banrural GTQ 3018079289 (Oscar Gálvez)','activo',4),
    ('1.1.2.4','Banco Industrial GTQ 0120407879 (Anterior)','activo',4),
    ('1.1.2.5','Banco Industrial USD 0120407978 (Internacional)','activo',4),
    ('1.1.2.6','Banco Industrial GTQ 853-000016-8 (Nueva)','activo',4),
    ('1.1.2.7','Banco Industrial GTQ 014-307678-4 (María Reyes)','activo',4),
    ('1.1.2.8','BAC',                           'activo',   4),
    ('1.1.3','Cuentas por cobrar',              'activo',  3),
    ('1.2',  'Activo fijo',                     'activo',  2),
    ('1.2.1','Propiedad planta y equipo',       'activo',  3),
    ('1.2.2','Equipo de informática',           'activo',  3),
    ('1.2.3','Bienes inmuebles',                'activo',  3),
    ('1.2.4','Vehículos',                       'activo',  3),

    -- ── 2 · PASIVO ──
    ('2',    'Pasivo',                          'pasivo',  1),
    ('2.1',  'Pasivo circulante',               'pasivo',  2),
    ('2.1.1','Cuentas por pagar suministradores','pasivo', 3),
    ('2.1.2','Impuesto pequeño contribuyente por pagar','pasivo',3),
    ('2.1.3','Otras cuentas por pagar',         'pasivo',  3),
    ('2.1.4','Cuentas x pagar tarjeta de crédito (TC) BI','pasivo',3),
    ('2.2',  'Pasivo fijo',                     'pasivo',  2),
    ('2.2.1','Préstamos a largo plazo por pagar','pasivo', 3),
    ('2.2.2','Otros préstamos de largo plazo por pagar','pasivo',3),
    ('2.2.3','Depreciación acumulada de vehículos','pasivo',3),

    -- ── 3 · PATRIMONIO ──
    ('3',    'Patrimonio',                      'capital', 1),
    ('3.1',  'Patrimonio',                      'capital', 2),
    ('3.1.1','Capital socios',                  'capital', 3),

    -- ── 4 · INGRESOS (Ventas) ──
    ('4',    'Ventas',                          'ingreso', 1),
    ('4.1',  'Ventas',                          'ingreso', 2),
    ('4.1.1','Alquiler de vehículo',            'ingreso', 3),
    ('4.1.2','Otros ingresos',                  'ingreso', 3),
    ('4.1.3','Traslado de personas',            'ingreso', 3),

    -- ── 5 · GASTOS VARIABLES (costo) ─ equipo con ImportadorSAT/Gastos ─
    ('5',    'Gastos',                          'gasto',   1),
    ('5.1',  'Combustibles',                    'costo',   3),
    ('5.2',  'Mantenimiento vehículos',         'costo',   3),
    ('5.3',  'Repuestos y llantas vehículos',   'costo',   3),
    ('5.4',  'Seguros',                         'costo',   3),

    -- ── 6 · GASTOS FIJOS (gasto) ─ códigos que la app busca ─────
    ('6.1',  'Salarios',                        'gasto',   3),
    ('6.4',  'Servicios (teléfono, internet)',  'gasto',   3),
    ('6.5',  'Oficina y papelería',             'gasto',   3),
    ('6.7',  'Alimentación y hospedaje',        'gasto',   3),
    ('6.9',  'Impuestos',                       'gasto',   3),
    ('6.11', 'Otros gastos',                    'gasto',   3)
) v(codigo, nombre, tipo, nivel)
CROSS JOIN empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM cuentas_contables c
  WHERE c.empresa_id = e.id AND c.codigo = v.codigo
);

-- ── 4) Índice único ─ previene duplicados a futuro ───────────────────
DROP INDEX IF EXISTS uq_cuentas_contables_empresa_codigo;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuentas_contables_empresa_codigo
  ON cuentas_contables (empresa_id, codigo);

COMMIT;

-- ═══ VERIFICACIÓN (opcional) ═══════════════════════════════════════
SELECT codigo, nombre, tipo, nivel, activa
FROM cuentas_contables ORDER BY codigo;
