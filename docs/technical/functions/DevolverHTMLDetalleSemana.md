# DevolverHTMLDetalleSemana

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLDetalleSemana` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Detalle_Semana` (componentId: `4790826000001006533`, pageFuncWfId: `4790826000001006551`) |
| **Roles con acceso** | Roles RRHH |

## Qué hace

Muestra el detalle de una semana específica: rango de fechas + tabla 9 columnas (Técnico | Cliente | Lun–Dom) con badges de turno (M/T/N/?) y tooltip HTML mostrando horas.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `anio` | int | Año |
| `semana` | int | Número de semana (1-52) |

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Asignacion_T_cnico_Cliente` | Asignaciones activas para la semana | `Tecnico`, `Cliente`, `Dias_Laborales`, `Turnos` (subform) |

## Acceso a datos de subform

Los registros de subform `Turno` se acceden VIA el padre:
```deluge
parentId = r.Asignacion_T_cnico_Cliente
parentRec = Asignacion_T_cnico_Cliente[ID == parentId]
diasLab = parentRec.Dias_Laborales
turnList = parentRec.Turnos  // subgrid
```

**NO** funciona: `Turno[Asignacion_T_cnico_Cliente == parentId]` → "Variable does not exist in Turno".

## Notas / Bugs conocidos

- `parentId != 0` (int), NO `parentId != ""` — type mismatch si se compara con string.
- Los registros de subform solo se acceden via el registro padre, no con query inverso.
