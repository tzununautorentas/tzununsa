-- ═══════════════════════════════════════════════════════════════════
-- NOMENCLATURA / CATÁLOGO DE CUENTAS — Tz'ununSA (Guatemala)
-- Basado en la nomenclatura enviada por el propietario (Tz'unun AutoRentas)
-- Distribuida por tipo: 1→Activo · 2→Pasivo · 3→Patrimonio · 4→Ingresos · 5→Egresos
-- 1xxx  nivel 1 · 11xx nivel 2 · 1101xx nivel 3 (cuentas de movimiento)
--
-- EJECUTAR EN: Supabase → SQL Editor → "Run WITHOUT RLS"
-- Es idempotente: no duplica cuentas que ya existan en cada empresa.
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
SELECT e.id, v.codigo, v.nombre, v.tipo, v.nivel, true
FROM (
  VALUES
    -- ── 1 · ACTIVO ──
    ('1',       'Activo',                        'activo',     1),
    ('11',      'Activo circulante',             'activo',     2),
    ('1101',    'Caja',                          'activo',     3),
    ('1102',    'Bancos',                        'activo',     3),
    ('110201',  'Banrural GTQ 3099347613 (Anterior)',           'activo', 3),
    ('110202',  'Banrural GTQ 3309159475 (Nueva)',              'activo', 3),
    ('110203',  'Banrural GTQ 3018079289 (Oscar Gálvez)',       'activo', 3),
    ('110204',  'Banco Industrial GTQ 0120407879 (Anterior)',   'activo', 3),
    ('110205',  'Banco Industrial USD 0120407978 (Internacional)','activo', 3),
    ('110206',  'Banco Industrial GTQ 853-000016-8 (Nueva)',    'activo', 3),
    ('110207',  'Banco Industrial GTQ 014-307678-4 (María Reyes)','activo', 3),
    ('110208',  'BAC',                           'activo',     3),
    ('1103',    'Cuentas por cobrar',            'activo',     3),
    ('110301',  'Cuentas por cobrar clientes',   'activo',     3),
    ('110302',  'Otras cuentas por cobrar',      'activo',     3),
    ('12',      'Activo fijo',                   'activo',     2),
    ('1201',    'Propiedad planta y equipo',     'activo',     3),
    ('1202',    'Equipo de informática',         'activo',     3),
    ('1203',    'Bienes inmuebles',              'activo',     3),
    ('1204',    'Vehículos',                     'activo',     3),

    -- ── 2 · PASIVO ──
    ('2',       'Pasivo',                        'pasivo',     1),
    ('21',      'Pasivo circulante',             'pasivo',     2),
    ('2101',    'Cuentas por pagar suministradores','pasivo',   3),
    ('2102',    'Impuesto pequeño contribuyente por pagar','pasivo', 3),
    ('2103',    'Otras cuentas por pagar',       'pasivo',     3),
    ('2104',    'Cuentas x pagar tarjeta de crédito (TC) BI','pasivo', 3),
    ('22',      'Pasivo fijo',                   'pasivo',     2),
    ('2201',    'Préstamos a largo plazo por pagar','pasivo',   3),
    ('2202',    'Otros préstamos de largo plazo por pagar','pasivo', 3),
    ('2203',    'Depreciación acumulada de vehículos','pasivo', 3),

    -- ── 3 · PATRIMONIO ──
    ('3',       'Patrimonio',                    'patrimonio', 1),
    ('31',      'Patrimonio',                    'patrimonio', 2),
    ('3101',    'Capital socios',                'patrimonio', 3),

    -- ── 4 · INGRESOS (Ventas) ──
    ('4',       'Ventas',                        'ingresos',   1),
    ('41',      'Ventas',                        'ingresos',   2),
    ('4101',    'Alquiler de vehículo',          'ingresos',   3),
    ('4102',    'Otros ingresos',                'ingresos',   3),
    ('4103',    'Traslado de personas',          'ingresos',   3),

    -- ── 5 · EGRESOS (Gastos) ──
    ('5',       'Gastos',                        'egresos',    1),
    ('51',      'Gastos variables',              'egresos',    2),
    ('5101',    'Car Wash (Lavado de carros y utensilios de limpieza)','egresos', 3),
    ('5102',    'Combustibles',                  'egresos',    3),
    ('5103',    'Mano de obra conductor-a',      'egresos',    3),
    ('5104',    'Trámites legales (abogado, timbres, impresión, etc)','egresos', 3),
    ('5105',    'Mantenimiento vehículos',       'egresos',    3),
    ('5106',    'Repuestos vehículos',           'egresos',    3),
    ('5107',    'Impuestos (de salida, aduanales, peajes, etc)','egresos', 3),
    ('5108',    'Alimentación',                  'egresos',    3),
    ('5109',    'Hospedaje',                     'egresos',    3),
    ('5110',    'Parqueo',                       'egresos',    3),
    ('5111',    'Alquiler de vehículo',          'egresos',    3),
    ('5112',    'Capacitaciones al personal',    'egresos',    3),
    ('5113',    'Gastos de publicidad y promoción','egresos',  3),
    ('5114',    'Gastos médicos',                'egresos',    3),
    ('5115',    'Enderezado y pintura',          'egresos',    3),
    ('5116',    'Traslados varios (Uber, taxis, etc)','egresos',3),
    ('5117',    'Comisiones bancarias',          'egresos',    3),
    ('5118',    'Deducible seguros',             'egresos',    3),
    ('52',      'Gastos fijos',                  'egresos',    2),
    ('5201',    'Servicio teléfono e internet',  'egresos',    3),
    ('5202',    'Parqueo flotilla',              'egresos',    3),
    ('5203',    'Póliza de seguro',              'egresos',    3),
    ('5204',    'Intereses préstamo',            'egresos',    3),
    ('5205',    'Depreciación gasto vehículos',  'egresos',    3),
    ('5206',    'Salarios',                      'egresos',    3),
    ('5207',    'Servicio garita de seguridad colonia Lo de Bran','egresos', 3)
) v(codigo, nombre, tipo, nivel)
CROSS JOIN empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM cuentas_contables c
  WHERE c.empresa_id = e.id AND c.codigo = v.codigo
);