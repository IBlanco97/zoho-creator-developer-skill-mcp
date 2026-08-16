# Sesión 2026-07-08 — 15:02

## Resumen
Se hizo visible en el planificador la totalidad de asignaciones (antes ~205 pares técnico-cliente no aparecían) y, tras el aumento de filas, se rediseñó el lector con **caché de HTML por fila** para no reventar el límite de statements de Deluge. Todo desplegado vía navegador (Zoho IDE), sin commits git.

## Implementado

### Backfill de la proyección `Asignacion_Tecnico_Cliente_Anio`
- **Qué**: materializar todas las asignaciones que no aparecían en el planificador.
- **Causa raíz**: doble modelo de fechas — asignaciones legacy guardan el periodo en el PADRE (`Fecha_de_Inicio`/`Fecha_de_Fin`) con el subform `Fechas` vacío; las nuevas usan el subform. El materializador `CrearAsignacionEnCalendario52Semanas` leía solo `Fechas` → no generaba nada para las legacy. Además ~205 pares tenían filas `_Anio` basura con `Anio` vacío (no renderizan, el lector filtra `Anio==año`).
- **Componentes**: `CrearAsignacionEnCalendario52Semanas` (funcId `4790826000000627767`) — añadido FALLBACK a fechas del padre cuando `Fechas` vacío. Verificado que el trigger on-add/edit ya la llama (no se re-acumula).
- **Ejecución**: función one-shot `ProgramaAnualActividadTecnico.RepararRegistrosAnio` (creada por API, ejecutada por lotes, borrada al terminar). Dedup por (Técnico, Cliente) con `Anio>0` → converge y respeta la semántica real (1 fila por técnico+cliente+año); el `delete` de CrearAsignacion limpia la basura Anio-vacío del par.
- **Resultado**: 314 asignaciones, 0 errores, 0 sin-datos. Verificado FRIME/Claudia (antes 10 filas vacías → 3 limpias).

### Caché de HTML por fila (idea del usuario)
- **Qué**: eliminar el desbordamiento de statements del lector al crecer a ~250 filas/año.
- **Causa**: en Deluge cada `+` de concatenación cuenta como statement; el lector construía 52 celdas × N filas × ~17 concat ≈ 200k statements.
- **Componentes**:
  - `CrearAsignacionEnCalendario52Semanas`: tras setear S1..S52, genera las 52 `<td>` (link Detalle_Semana + clase color on/off/nohab + tooltip) y las guarda en el campo **`Observaciones`** de `_Anio` (marcador `wtip`).
  - `DevolverHTMLCalendario52Semanas` (funcId `4790826000000686037`): reescrito — por fila solo lee `r.Observaciones` + celdas de nombre (~6 stmt/fila vs ~1000). Semana actual y filtro de rango → CSS `nth-child` inyectado. Gates de rango neutralizados (`if(1==1)`) para alineación. CSV solo si `recibir_ != ""`. Precómputo de labels de fecha 1 vez.
- **Notas técnicas**:
  - Campo de caché = `Observaciones` reutilizado (multilínea 65535, no se muestra). Compromiso porque el form builder era inviable de automatizar (canvas en iframe `designPreviewFrame`, paleta no accesible). Deuda: migrar a campo dedicado `Celdas_HTML`.
  - Re-materialización con orquestador (MAX_BATCH=6, dedup por marcador `wtip`): 314 pares, 0 errores.
  - **Verificado end-to-end**: planificador 2026 renderiza 248 filas × 54 columnas, 12.532 celdas, 0 errores; colores on/nohab/permisos OK, semana actual resaltada.

## Bugs corregidos
- **Asignaciones legacy invisibles en planificador**: no aparecían → materializador leía solo subform `Fechas` (vacío en legacy) → FALLBACK a fechas del padre + backfill.
- **Filas `_Anio` basura (Anio vacío) contadas como "cubiertas"**: el dedup inicial las saltaba → cambiar chequeo a `Anio > 0`; al re-materializar, el `delete` por (Técnico,Cliente) las limpia.
- **Planificador caído "statement execution limit" (línea 186/213)**: tras backfill, ~250 filas reventaban el lector → caché HTML por fila.

## Pendiente / próxima sesión
- **Fix visual `esLibre_`** en `DevolverHTMLCalendario52Semanas`: el cierre de cliente solo pinta borde punteado, no libera la celda a "off". Se omitió del caché a propósito; rediseñar aparte.
- (Opcional) Migrar el caché de `Observaciones` a un campo dedicado `Celdas_HTML`.
- (Opcional) Limpiar filas `_Anio` HUÉRFANAS con Técnico/Cliente vacíos (inofensivas).
- Staleness menor: si cambia nombre/turnos de cliente, el tooltip cacheado no se actualiza hasta re-guardar la asignación.

## Commits del día
(ninguno — trabajo desplegado directamente en Zoho vía navegador; drafts locales actualizados en `deluge-drafts/`)

## Patrones descubiertos
- **Crear función custom por API**: `POST /workflowbuilder/edit/populateCustomFunction` con `scripttype:workflowadd` (+ `workflowdelete` para borrar). Cuerpo grande → lint espurio; truco stub→modify (el editor modify da `lineNumber` exacto).
- **Ejecutar función headless**: `POST /workflowbuilder/edit/executeScript` (parametrless, output de `info` en `.zc-dem-execute-script-content`). Ideal para one-shots por lotes.
- **Deluge server-side**: `Form[criteria]` devuelve TODOS los registros (sin tope 200 del REST). `offset by/limit` NO válido en custom function ("Improper Statement"). `.count()` sobre query (NO `.size()`).
- **Caché de HTML materializado**: para render de muchas filas, generar el HTML al escribir y guardarlo en un campo; el lector solo concatena. Lo dinámico (semana actual, filtros) vía CSS `nth-child` — Zoho borra `<script>` de snippets pero NO `<style>`.
- Todo lo anterior ya volcado en skill (`zoho-errors-ref`, `zoho-ide-flows`) y memoria (`bug-anio-duplicados-planificador`, `feedback_custom_function_create`).
