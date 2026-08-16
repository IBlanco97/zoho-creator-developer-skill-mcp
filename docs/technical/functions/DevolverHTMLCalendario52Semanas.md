# DevolverHTMLCalendario52Semanas

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLCalendario52Semanas` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Semanas_Nuevo` |
| **Roles con acceso** | Roles RRHH |

## Qué hace

Genera un calendario visual de 52 semanas del año. Cada celda muestra el número de semana y al hacer hover un tooltip CSS con `S{n} | {fecha_inicio} - {fecha_fin}` y opcionalmente `| {Tipo}` si la semana está asignada. Al hacer click navega a `#Page:Detalle_Semana?Anio={anio}&Semana={wn}`.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `anio` | int | Año a mostrar |

## Formularios que consulta

Consulta registros de semanas/asignaciones para el año indicado.

## Estructura HTML generada

```
Calendario grid 52 celdas
├── Cada celda: número de semana
│   ├── data-t attribute con tooltip (S{n} | fechas | tipo)
│   ├── CSS ::before content:attr(data-t) para tooltip hover
│   └── Click → #Page:Detalle_Semana?Anio={anio}&Semana={wn}
```

**Puro Deluge, sin JavaScript**: Zoho elimina `<script>` tags — los tooltips usan CSS puro (`::before` + `content:attr(data-t)`).

**Lista `dates` pre-computada**: Se calcula en el loop header y se reutiliza en el loop body para evitar recalcular fechas.

## Notas / Bugs conocidos

- Filtro de empleado + semana actual añadido en Sprint mejoras UX (A3).

## Render unificado por técnico + técnicos vacíos (2026-07-28)

- **Antes**: las asignaciones (`Asignacion_Tecnico_Cliente_Anio`) y los permisos/vacaciones (`Solicitud`) se pintaban en dos bucles totalmente separados — todas las filas de asignación de todos los técnicos primero, luego todas las filas de permiso de todos los técnicos al final de la tabla. Además la lista de técnicos solo se construía a partir de quien tuviera asignaciones ese año, así que un técnico sin asignaciones ni permisos no aparecía en absoluto.
- **Ahora**: un único bucle sobre `nameIdList` por técnico — imprime sus filas de asignación (ordenadas por cliente) y a continuación, inmediatamente, sus filas de permiso/vacación. Si no tiene ningún dato ese año, se imprime una fila vacía (celdas `off`, sin datos de clic) para que igual aparezca — solo cuando no hay filtro de cliente activo (un filtro de cliente por definición debe excluir a quien no tiene ese cliente).
- **Lista maestra de técnicos**: unión de (a) `Nuevo_Empleado[Estado_del_Empleado == "Activo"]` (decisión del usuario: todos los activos, no solo los que tengan `Área_Profesional` de campo — no existe un flag "Es_Técnico" limpio en el formulario), (b) técnicos con asignación histórica aunque no estén activos, (c) técnicos con solicitud histórica aunque no estén activos.
- **Optimización de sentencias** (pedido explícito del usuario — límite 5000 sentencias/ejecución): se eliminaron TODAS las queries dentro de bucles por técnico. Antes: 1 query `Asignacion_Tecnico_Cliente_Anio` + 1 query `Nuevo_Cliente` por cada fila de asignación. Ahora: 1 query a granel por tabla (`regTemp`, `solRecs`, `empRecsBase`, `Nuevo_Cliente` completo → `clienteNameMap`), agrupadas en memoria con `Map` (`empRegsByTec`, `solByTec`) usando el ID de técnico como key. Las filas de asignación se empaquetan en un string delimitado por el carácter `‡` (U+2021, elegido para evitar la ambigüedad de `toList()` con separadores multi-carácter) para poder ordenarlas con `list.sort()` sin volver a tocar la BD. Las celdas "off" de una fila de técnico vacío se precomputan UNA sola vez (`offCellsStatic`) y se reutilizan por concatenación simple en cada técnico sin datos, en vez de repetir un bucle de 52 iteraciones por cada uno.
- Backup: `deluge-drafts/DevolverHTMLCalendario52Semanas.deluge` (versión anterior en `.BACKUP.deluge`).
