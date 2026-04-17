# Detalle Semana

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Detalle_Semana` |
| **componentId** | `4790826000001006533` |
| **pageFuncWfId** | `4790826000001006551` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Detalle_Semana?Anio={anio}&Semana={wn}` |
| **Módulo** | Asignaciones |
| **Menú** | No aparece en menú (se accede desde Semanas_Nuevo) |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Roles RRHH | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLDetalleSemana(anio, semana)` |

## Variables de página

| Variable | Tipo | Uso |
|----------|------|-----|
| `Anio` | Number | Año |
| `Semana` | Number | Número de semana (1-52) |

## Notas

- Tabla 9 columnas con badges de turno (M/T/N/?).
- Accede a subform `Turno` via registro padre (no query inverso).
