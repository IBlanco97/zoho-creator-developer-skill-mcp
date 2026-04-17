# Timeline Permisos

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Timeline_Permisos` |
| **componentId** | `4790826000001013041` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Timeline_Permisos` |
| **Módulo** | RRHH — Permisos |
| **Menú** | RRHH |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLTimelinePermisos(anio)` |

## Variables de página

| Variable | Tipo | Uso |
|----------|------|-----|
| `Anio` | Number | Año a mostrar (por defecto año actual) |

## Notas

- Tabla 12 columnas mensuales con celdas azules para permisos aprobados.
- Bug crítico resuelto: `anioStr = anio.toString()` necesario antes de usar `anio` en `toDate()` inline — sin esto Deluge hace aritmética (`2026 - 01 - 31`) en vez de concatenar string.
