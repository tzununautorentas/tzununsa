# AUDITORÍA DE ESTADO — FASE 3.2

Fecha de auditoría: 2026-09-18 · Proyecto: ERP Tz'unun (Supabase `fmijbpatkddkbxlkfoza`) · Repo: `tzununautorentas/tzununsa`

**Método y límite de acceso:** solo archivos, git e informes. **No existe `.env` ni cadena de conexión en el repo; no es posible interrogar Supabase en vivo desde esta sesión.** El estado de la base se sustenta en evidencia documental + relato del usuario; donde la DB no es verificable se declara `NO VERIFICABLE` y se adjunta la consulta READ-ONLY que el owner debe pegar para cerrar la brecha.

---

## 1. Resumen ejecutivo

El plan vigente es `FASE3.2_PLAN.md` (orden `3.2A→3.2B→3.2C→3.2D`, permiso 2026-09-16) refinado por planes detallados y scripts por fase. Con evidencia en repo: **3.2A quedó registrada como COMPLETADA Y VALIDADA** (registro §0 de `FASE3.2B_PLAN_DETALLADO.md`, confirmado 2026-09-16). **3.2B y 3.2C tienen commits** pero sin informe de cierre ni GATE documentado. **3.2D dejó instalada la estructura** (R2) pero su GATE final (R4-R1) no tiene evidencia de aprobación, y la penúltima revisión R4 tenía error de sintaxis. **3.2E (R3.1) está en curso y BLOQUEADA en PC7** porque el snapshot `_bkp_32e.movimientos_bancarios` ya existía; el operador creó el respaldo alterno `…_20260919043225` (33/Q64,708.15, idéntico), pero **la migración estructural y el `GATE 3.2E-R3.1` no tienen evidencia de haberse completado**. El commit más reciente del repo es `a222538` (3.2C-R1, 2026-09-16); **3.2D y 3.2E están sin commitear**. El siguiente paso correcto es resolver el bloqueo PC7 de 3.2E-R3.1 y ejecutarla hasta el GATE; antes/después cerrar los GATEs abiertos de 3.2C-R2 y 3.2D-R4-R1.

## 2. Plan original identificado

| Documento | Versión/Revisión | Fecha | Rol |
|---|---|---|---|
| `FASE3.1_PLAN.md` | v2 (JWT/fetcher) | 2026-09-11 | Precedente 3.1 |
| `FASE3.2_PLAN.md` | esquema GRUPO A (3.2A–3.2D) | 2026-09-16 | **Plan maestro vigente** |
| `FASE3.2_PREFLIGHT_INFORME.md` | preflight owner/anon | 2026-09-16 | Cierres C1–C6 + SQL corregido |
| `FASE3.2B_PLAN_DETALLADO.md` | 3.2B + registro 3.2A | 2026-09-16 | Vigente (header sin actualizar) |
| `FASE3.2C_PLAN_DETALLADO.md` | 3.2C | 2026-09-16 | Vigente |
| `FASE3.2D_PLAN_DETALLADO.md` | 3.2D | post-3.2C | Vigente |
| `FASE3.2E_PLAN_DETALLADO.md` | 3.2E | 2026-09-18 | **Revisión implementada: R1→R2→R3→R3.1** |

**Versión más reciente en vigor para 3.2E:** `sql/migracion_fase_3_2e.sql` = **3.2E-R3.1**. Las copias `…_r3_1_CORREGIDO.sql` y `…_r3_1_CORREGIDO (1)_2.sql` son **byte-idénticas** a `_r3_1.sql` (comparadas con `Compare-Object`, 0 diferencias): el nombre "CORREGIDO" no contiene corrección alguna.

**Sombra de revisiones 3.2D:** `3.2d.sql` (R2) → `_r3` (GATE textual) → `_r4` (**syntax error 42601**, `position()`) → `_r4_r1` (strpos, versión final pendiente de ejecución verificada).

## 3. Línea de tiempo de ejecución

| Fecha (fuente) | Evento | Evidencia |
|---|---|---|
| 2026-09-11 | Auditorías 3/3A/3A1 | commits `69a53eb, 2adc726, 0b8e70c, 11dfdc4` |
| 2026-09-11 | Plan 3.1 | commit `b851401` |
| 2026-09-16 | FASE 3.1 implementada y compilada (build PASS, 8/8 headless) | commits `fcac1f7, 10d87f3, 297d0e1`, `FASE3.1_INFORME.md` |
| 2026-09-16 | Pre-flight FASE 3.2 (solo lectura) | commit `63d6824`, `.backups\3.2-preflight\2026-09-16T16-23-…` |
| 2026-09-16 | FASE 3.2A ejecutada y VALIDADA (owner) | commit `edee2ce` + registro §0 de `FASE3.2B_PLAN_DETALLADO.md` |
| 2026-09-16 | FASE 3.2B infraestructura + fix tipos `bigint` | commits `4885058, f88b531, 3bdf370` |
| 2026-09-16 | FASE 3.2C (R1) commit + GATE R1 fallido (constraint revertido por ROLLBACK) | commit `a222538` + header `sql/migracion_fase_3_2c.sql` (R2); R2 sin commitear |
| post-2026-09-16 | 3.2D R2 instaló `estado`+CHECK+`fn_recalcular_saldo_cuenta()`; R3/R4/R4-R1 iteran el GATE (R4 con error 42601; R4-R1 corrige) | headers de los 4 scripts (sin commitear) |
| post-2026-09-16 | 3.2E R1..R3.1 generadas (sin commitear) | `sql/migracion_fase_3_2e*.sql` |
| 2026-09-18 22:32 local (≈2026-09-19 04:32 UTC) | **Ejecución reciente 3.2E-R3.1 → bloqueo `PC7 BLOQUEO: _bkp_32e.movimientos_bancarios YA EXISTE`; verificada la primera snapshot (33/Q64,708.15); creado respaldo alterno `_bkp_32e.movimientos_bancarios_20260919043225` (33/Q64,708.15)** | Relato del usuario (sin log en repo) |

## 4. Estado por fase

| Fase | Estado | Evidencia | Pendientes |
|---|---|---|---|
| **3.1** | **PARCIAL** | Informe + build PASS + commits | Validación manual A/C/H en navegador + aprobación del usuario |
| **Preflight 3.2** | **CONFIRMADA CERRADA** | Informe 2026-09-16; las 3 verificaciones owner pendientes resueltas según registro 3.2A (PG 17.6, asientos/lineas/usuarios = 0, estados OK) | — |
| **3.2A** | **CONFIRMADA CERRADA** (declarada) | Registro §0 3.2B-plan (tabla de verificaciones) + commit `edee2ce` | Verificación de esquema en vivo (owner) — hoy NO VERIFICABLE desde repo |
| **3.2B** | **PARCIAL / ABIERTA** | Commits `f88b531, 3bdf370`; plan.md aún dice "PARA REVISIÓN — NO EJECUTAR"; sin informe de cierre ni evidencias de pruebas | Cierre formal + evidencias de pruebas/criterios de aceptación |
| **3.2C** | **ABIERTA** | Commit R1 fallido (constraint no persistió, DB limpia 47 filas — narrativa R2); R2 (COMMIT top-level + GATE) en working-tree sin ejecución verificada | Ejecutar 3.2C-R2 → `GATE 3.2C-R2 OK` |
| **3.2D** | **PARCIAL** | R2 declaró estructura instalada; GATE R2 falló; R3 falló en validación textual; R4 **syntax error**; R4-R1 final **sin evidencia de ejecución** | Ejecutar 3.2D-R4-R1 → `GATE 3.2D-R4-R1 OK` |
| **3.2E** | **BLOQUEADA (PC7) / ABIERTA** | R3.1 listo; ejecución reciente detenida en PC7; CORREGIDO==R3.1 (sigue bloqueando); sin evidencia de estructura ni de GATE | **Resolver PC7 → ejecutar todo → `GATE 3.2E-R3.1 OK` → `FASE3.2E_INFORME.md`** |

## 5. Estado de Supabase (solo evidencia documental)

> Sin credenciales en el repo. Conteos/suma: relato del usuario. Estructura: scripts sin outputs. **NO VERIFICABLE en vivo.** Consultas READ-ONLY que el owner debe pegar en SQL Editor para cerrar la brecha:

```sql
SELECT version();
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
 WHERE table_schema='public' AND table_name='movimientos_bancarios' ORDER BY ordinal_position;
SELECT indexname, indexdef FROM pg_indexes
 WHERE schemaname='public' AND tablename='movimientos_bancarios';
SELECT count(*), sum(monto) FROM public.movimientos_bancarios;
SELECT c.* FROM _bkp_32e.movimientos_bancarios c;
SELECT c.* FROM _bkp_32e.movimientos_bancarios_20260919043225 c;
SELECT count(*) FROM cuentas_bancarias;
SELECT empresa_id, count(*) FROM cuentas_bancarias GROUP BY 1;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
 WHERE conrelid='public.movimientos_bancarios'::regclass;
SELECT tgname FROM pg_trigger WHERE tgrelid='public.movimientos_bancarios'::regclass;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
 WHERE conrelid='public.cuentas_contables'::regclass AND conname='uq_cuenta_empresa_codigo';
SELECT column_name, data_type, is_nullable FROM information_schema.columns
 WHERE table_schema='public' AND table_name IN ('asientos_contables','asiento_lineas');
```

Previsto por plan y por scripts: `estado` (3.2D, text NOT NULL default 'activo' + `chk_movbancario_estado`), `fn_recalcular_saldo_cuenta()` sin trigger; en 3.2E: `origen_tipo text NULL`, `origen_id uuid NULL`, `tipo_flujo text NULL`, `cuenta_contraparte_id uuid NULL`, `movimiento_contraparte_id uuid NULL`, `uq_mov_origen` (único/parcial/excl. transferencia), `idx_mov_cuenta_fecha` (si PC8 no halla equivalente). **Nada de esto está confirmado en vivo.**

## 6. Estado de backups

| Recurso | Reportado por el usuario | Repo |
|---|---|---|
| Tabla productiva `public.movimientos_bancarios` | 33 registros / Q64,708.15 | preflight JSONL 2026-09-16: 33 ✓ |
| Snapshot original `_bkp_32e.movimientos_bancarios` | 33 / Q64,708.15 (existía antes del bloqueo) | no verificable |
| Snapshot alterno `_bkp_32e.movimientos_bancarios_20260919043225` | 33 / Q64,708.15 (creado sin sobrescribir) | no verificable |
| `.backups/3.2-preflight/…` | dump REST 2026-09-16T16:23Z | presente (33 movs, 47 cuentas_contables, 17 facturas, 7 cuentas_bancarias, manifiesto sha256) |

- **NO se elimina ni reemplaza ni renombra nada** (regla de la auditoría respetada).
- **¿El respaldo alterno satisface el requisito del plan?** Como *redundancia de respaldo*: sí (33/33, misma suma). Como *desbloqueo del script*: **NO** — el plan (§10/PC7) manda "esquema alterno `_bkp_32e_<ts>`", no tabla alterna en el mismo esquema, y el script R3.1 (CORREGIDO incluido) **sigue bloqueando** mientras exista `_bkp_32e.movimientos_bancarios` (que es, además, el objeto que usa el GATE-R3.1 8bis para el cross-check del checksum).
- La fecha `20260919043225` es coherente con el reloj del servidor en UTC (04:32 UTC = 22:32 del 2026-09-18 en Guatemala, UTC−6).

## 7. GATEs y bloqueos

| GATE / Bloqueo | Qué debía comprobar | Evidencia | Resultado |
|---|---|---|---|
| Registro 3.2A (owner) | esquema asientos/facturas/índices/backfills | tabla §0 3.2B-plan (2026-09-16) | **APROBADO** |
| GATE 3.2C-R1 → **bloqueo** | constraint `uq_cuenta_empresa_codigo` persistido | header R2 (R1: "constraint NO existe", DB limpia 47 filas) | **BLOQUEADO/FALLIDO** |
| GATE 3.2C-R2 | idem con COMMIT top-level + prueba ROLLBACK | sin ejecución registrada | **PENDIENTE** |
| GATE 3.2D (R2/R3) | estructura + flags `tz32d.*` | R2/R3 headers (fallos set_config / validación textual) | **FALLIDO** |
| GATE 3.2D-R4 | — | **syntax error 42601** (`position()`) → R4 no ejecutable | **NO EJECUTADO** |
| GATE 3.2D-R4-R1 | estructura + función estructural + marcadores `strpos` | sin ejecución registrada | **PENDIENTE** |
| GATE 3.2E-R3.1 | 5 columnas, uq_mov_origen estricto, índice PC8 exacto, 0 triggers, checksum congelado PRE=POST+SNAPSHOT, T1 PASS | sin ejecución registrada | **PENDIENTE** |
| **PC7 (3.2E-R3.1)** | snapshot `_bkp_32e` creado/no-colisionante | relato 2026-09-18: "PC7 BLOQUEO … YA EXISTE" | **BLOQUEADO (vigente)** |

## 8. Inconsistencias detectadas

| # | Plan | Real / Informe | Impacto | ¿Impide avanzar? |
|---|---|---|---|---|
| I1 | 3.2B plan.md: "PARA REVISIÓN — NO EJECUTAR" | Commits `f88b531`, `3bdf370` ya la ejecutaron | Doc desfasado; sin informe de cierre | No |
| I2 | 3.2C-R2 (COMMIT + GATE) | Existía ya commit R1; R2 sin commitear y sin salida | No se sabe si el constraint existe en DB | No técnicamente (independiente de 3.2E); sí para "cierre del plan" |
| I3 | Plan 3.2E §10: esquema alterno `_bkp_32e_<ts>` | Se creó tabla alterna `_bkp_32e.movimientos_bancarios_<ts>` (mismo esquema) | No desbloquea PC7 | **Sí (PC7 sigue bloqueando)** |
| I4 | "CORREGIDO" implica corrección | `CORREGIDO (1)_2.sql` y `_CORREGIDO.sql` = byte-idénticos a R3.1 | Re-ejecutar cualquiera vuelve a bloquear en PC7 | **Sí** |
| I5 | GATEs de 3.2C/3.2D "cerrados" en conversación | Sin log de salida en repo; R4 con error 42601; ejecución de R4-R1/PENDIENTE | Evidencia insuficiente | No para 3.2E (estructura sí depende de 3.2D-R2; GATE no) |
| I6 | 3.1: "no avanzar a 3.2 sin aprobación" | 3.2 avanzó | Brecha de proceso, no técnica | No |

## 9. Punto exacto donde estamos

**Estamos dentro de FASE 3.2E-R3.1, detenida en el pre-check PC7** por la colisión del snapshot; la **migración estructural de 3.2E (2.1–2.3 + COMMIT), la prueba T1, los post-checks y el `GATE 3.2E-R3.1` no tienen evidencia de haberse ejecutado**, y el script (incluidas las copias "CORREGIDO") no puede avanzar mientras exista `_bkp_32e.movimientos_bancarios`. Adicionalmente, los GATEs finales de **3.2C (R2)** y **3.2D (R4-R1)** siguen formalmente abiertos (este último con su estructura ya instalada por R2).

## 10. POSICIÓN EN EL PLAN GLOBAL DEL PROYECTO

Hoja de ruta completa según `FASE3A1_INFORME_TECNICO.md` §10 + `FASE3.2E_PLAN_DETALLADO.md` + FASES 1-2 (`AUDITORIA_CONTABILIDAD_FLUJO.md`):

| # | Fase | Contenido | Estado global |
|---|---|---|---|
| — | FASES 1 y 2 | Contabilidad y Flujo de Efectivo (auditoría de diseño, base de negocio) | Informe técnico `AUDITORIA_CONTABILIDAD_FLUJO.md` (diseño) |
| — | FASE 3 | Infraestructura multiempresa + banco | **EN CURSO** → abajo |
| 3.0 | Auditoría FASE 3 | `FASE3_AUDITORIA_TECNICA.md` / `AUDITORIA_PDF.md` | CERRADA (informe) |
| 3.1 | JWT/sesión/fetcher | `FASE3.1_INFORME.md` | **PARCIAL** (implementada+compilada; validación manual y aprobación pendientes) |
| 3.2A | Estructura contable | `FASE3.2B_PLAN_DETALLADO.md` §0 | **CONFIRMADA CERRADA** |
| 3.2B | Infraestructura multiempresa (`authz`, `usuario_empresas`, índices) | commits `f88b531, 3bdf370` | **PARCIAL / ABIERTA** (sin cierre documentado) |
| 3.2C | Catálogo híbrido (`uq_cuenta_empresa_codigo`) | R1 falló; R2 sin ejecución verificada | **ABIERTA** → GATE 3.2C-R2 |
| 3.2D | Estructura bancaria (`estado`, función saldo) | R2 instaló estructura; GATE final pendiente | **ABIERTA** → GATE 3.2D-R4-R1 |
| **3.2E** | **Arquitectura origen y flujo (5 columnas + 2 índices)** | **R3.1 = revisión vigente** | **BLOQUEADA (PC7)** → aquí estamos |
| — | Generador de movimientos / Flujo (NOT NULL + CHECK de `tipo_flujo`, dominio) | FASE 3.2E plan §12/§14.7 | NO EJECUTADA (requiere aprobación posterior) |
| 3.3 | Saldos históricos de facturas (GRUPO B.1; FAC-221920 excluida) | 3.2A1 §10 | NO EJECUTADA |
| 3.4 | Población `usuarios_sistema`/`usuario_empresas` (PUERTA DURA de 3.6) | 3.2A1 §10 | NO EJECUTADA (requiere lista real de usuarios) |
| 3.5 | Empresa activa + selector + filtros `empresa_id` | 3.2A1 §10 | NO EJECUTADA |
| 3.6 | Activar RLS + políticas | 3.2A1 §10 | NO EJECUTADA (riesgo ALTO; exige 3.1+3.4+3.5) |
| 3.7 | Reglas de negocio/UI (reversa, `numero` en Pagos, etc.) | 3.2A1 §10 | NO EJECUTADA |
| 3.8 | Trigger de saldos `trg_mov_saldo` | 3.2A1 §10 / 3.2D | NO EJECUTADA |
| 3.9 | Panel de revisión GRUPO C (huérfanos, FAC-221920) | 3.2A1 §10 | NO EJECUTADA |
| 3.10 | Pruebas de aceptación integrales + snapshot | 3.2A1 §10 | NO EJECUTADA |
| — | FASE 4 | Conciliación bancaria / estado de cuenta (movimientos importados) | NO EJECUTADA (documentada como dependencia de 3.3/3.9) |

> **Punto de interrupción:** estamos en **3.2E-R3.1 → pre-check PC7 (bloqueado por snapshot pre-existente)**. Todo lo posterior a 3.2E está pendiente de aprobación.

## 11. SIGUIENTE PASO CORRECTO

> **Fase:** 3.2E · **Subfase:** migración estructural · **Revisión:** R3.1 · **GATE:** primero desbloquear **PC7**, luego obtener **`GATE 3.2E OK (version 3.2E-R3.1)`**
>
> **EL SIGUIENTE PASO CORRECTO ES: resolución autorizada del bloqueo PC7 de 3.2E-R3.1 para poder ejecutar el script completo.** Con la copia alterna ya verificada, la opción recomendada es: **(a)** autorizar `DROP TABLE IF EXISTS _bkp_32e.movimientos_bancarios` (no se pierde nada: la alterna es idéntica y verificada) y **re-ejecutar** `sql/migracion_fase_3_2e.sql` (R3.1) ENTERO en SQL Editor como OWNER hasta ver `GATE 3.2E OK`; o **(b)** autorizar una revisión R3.2 que haga a PC7 **reutilizar el snapshot verificado** en lugar de bloquear. Tras el GATE OK: generar `FASE3.2E_INFORME.md` y **no avanzar a generador/flujo ni 3.3 sin aprobación** (plan §14.7). Además, cerrar los GATEs abiertos previos: 3.2C-R2 y 3.2D-R4-R1.

## 12. Qué NO debemos ejecutar todavía

- Nada sobre Supabase sin el comando explícito aprobado por ti.
- **No re-ejecutar 3.2E-R3.1 tal cual** (volverá a bloquear en PC7) sin resolver antes el snapshot.
- **No** `DROP`/`TRUNCATE`/`RENAME` de ninguna de las dos snapshots (requiere autorización; solo aplica el DROP de §11 si la autorizas).
- **No** autorizar nuevas fases: generador de movimientos/flujo, 3.3 (saldos), 3.4 (población `usuario_empresas`), 3.5 (dashboard), 3.6 (RLS), 3.7 (`concepto`/reglas), 3.8 (`trg_mov_saldo`), 3.9 (GRUPO C), FASE 4.
- **No** poblar/backfillear orígenes históricos, ni tocar `facturas`/`asientos`/movimientos huérfanos (GRUPO C), ni el constraint `uq_cuenta_empresa_codigo` ni `uq_asientos_identidad`.
- **No** hacer commits/push de `sql/migracion_fase_3_2c.sql` (modificado) ni de los archivos 3.2D/3.2E sin tu autorización.

## 13. Recomendación para la siguiente instrucción

El próximo prompt debería contener, en orden: (1) **autorización expresa** para resolver PC7 (opción a: `DROP` del snapshot original con la alterna verificada como respaldo; u opción b: revisión R3.2 de reutilización) y el comando de ejecución de `sql/migracion_fase_3_2e.sql` completo; (2) instrucción de **pegar la salida completa** (PC0–PC8, NOTICEs 2.1/2.2/2.3, T1-O/U/T/null, P1–P8 y la línea `GATE 3.2E OK…`) para registrar evidencia trazable; (3) ejecución posterior de `sql/migracion_fase_3_2d_r4_r1.sql` y `sql/migracion_fase_3_2c.sql` (R2) para cerrar sus GATEs; (4) generación de `FASE3.2E_INFORME.md` y `FASE3.2_INFORME.md` con las salidas; (5) **no avanzar a generador/flujo ni 3.3**. Incluye también que pegue las 8 consultas READ-ONLY de la §5 para cerrar los huecos `NO VERIFICABLE` de esquema.

---

**Regla final cumplida durante la auditoría:** solo lectura e inspección. No se modificó código, no se ejecutó SQL, no se tocó Supabase, no se hicieron commits. Este archivo es el único entregable nuevo (informe documental), generado a petición expresa del usuario.