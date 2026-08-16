# Sesión 2026-07-09 — 15:08

## Resumen
Diagnosticadas y eliminadas las "filas fantasma" (espacios en blanco) del Planificador causadas por registros huérfanos en la tabla proyección. Guard defensivo desplegado en producción tras destapar que el editor Deluge solo monta en `creator.zoho.com` (no `creatorapp.zoho.com`).

## Implementado

### Guard anti-filas-fantasma en el lector del Planificador
- **Qué**: filtro que salta registros `Asignacion_Tecnico_Cliente_Anio` sin cliente y sin caché de celdas, para que no rendericen una fila vacía ni roben el nombre del técnico.
- **Archivos/componentes**: custom function `Calendario52HTML.DevolverHTMLCalendario52Semanas`; backup local `deluge-drafts/DevolverHTMLCalendario52Semanas.deluge`.
- **Notas técnicas**:
  - Guard `if(cli == "" && celdasR == "") { continue; }` insertado al **inicio** del `if(cliMatch)`, ANTES de consumir `isFirstForTec`. Crítico: el huérfano ordena primero por `sort by Cliente asc`; si se procesa parcialmente, roba `tecCell = tecFull` y deja a los clientes reales sin nombre.
  - Transformación aplicada en JS sobre el `getValue()` real de producción (no pegando el backup) → evita drift; matches únicos confirmados (producción == backup, sin deriva).
  - Guardado vía POST `workflowbuilder/edit/populateCustomFunction` → 200; persistencia verificada tras reload (18480 chars, guard 1×).
  - Backup del código de producción pre-cambio: `.playwright-mcp/prod-DevolverHTMLCalendario52Semanas-backup.txt`.

## Bugs corregidos
- **Filas fantasma en Planificador**: técnicos con fila en blanco (ej. "Alonso Ruiz, L.") o nombre robado antes de sus clientes reales (ej. "Blanco González, I.") → registros huérfanos en `Asignacion_Tecnico_Cliente_Anio` con `Cliente` vacío/borrado Y `Observaciones` sin marcador `wtip` (`cli=""` + `celdasR=""` → fila vacía; `sort by Cliente asc` los ordena primero y roban el nombre) → guard que los salta en el loop `for each r in empRegs`. Defensivo, no toca datos.

## Pendiente / próxima sesión
- (Opcional) Limpiar en datos los registros `_Anio` con `Cliente` vacío — el guard los oculta, pero limpiar la tabla sería más sano.
- Verificación end-to-end visual: refrescar el Planificador y confirmar que "Alonso Ruiz, L." desaparece y "Blanco González, I." recupera su nombre (pendiente de confirmar por el usuario).
- Sigue pendiente el fix visual `esLibre_` (problema 1 del bug del planificador).

## Commits del día
(ninguno hoy — cambio en backup local `deluge-drafts/`, desplegado directamente en Zoho vía IDE)

Últimos commits del repo:
```
39ad194 Merge branch 'worktree-ordenar-planificador'
245549b feat: Planificador ordenado por técnico + botones email
dd0ea7a feat: mark Accedi_al_Portal_del_Empleado=SÍ on first portal login
```

## Patrones descubiertos
- **DOMINIO editor Deluge (crítico)**: el editor de custom functions/workflows SOLO monta en `creator.zoho.com`, NO en `creatorapp.zoho.com`. En `creatorapp` el microservicio `/delugeeditor/api/ui/v1/getDependencies` da **404 (text/html)** y el CodeMirror nunca aparece, aunque la página shell + `saveFuncBtn` sí carguen (engañoso). `creatorapp` es solo el app runner/preview (`#Page:`). Diagnóstico exprés: `fetch('https://creator.zoho.com/delugeeditor/api/ui/v1/getDependencies',{credentials:'include'})` → debe dar 200. Se perdieron ~22 h creyendo que el servicio estaba caído.
- **404 limpio + resto de la app OK = problema de host/routing**, no servicio caído. Un servicio muerto da timeouts/`ERR_`; un 404 con `text/html` en ruta `/api/` = la ruta no existe en ese host.
- **Seguridad al editar por navegador**: transformar el código en JS sobre el `getValue()` real (con conteo de matches único) en vez de pegar un backup → detecta drift y evita pisar cambios ajenos. Guardar el código de producción pre-cambio con el param `filename` de `browser_evaluate` antes de tocar nada.
