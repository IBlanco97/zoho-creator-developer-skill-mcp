# Semanas Nuevo (Calendario 52 Semanas)

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Semanas_Nuevo` |
| **componentId** | — |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Semanas_Nuevo` |
| **Módulo** | Asignaciones |
| **Menú** | Asignaciones |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Roles RRHH | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLCalendario52Semanas(anio)` |

## Variables de página

| Variable | Tipo | Uso |
|----------|------|-----|
| `Anio` | Number | Año del calendario (por defecto año actual) |

## Notas

- Calendario visual con tooltips CSS (sin JavaScript).
- Click en celda → `#Page:Detalle_Semana?Anio={anio}&Semana={wn}`.
- Filtro de empleado + semana actual (mejora UX A3).
