# Mis EPIs

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mis_EPIs` |
| **componentId** | — |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Mis_EPIs` |
| **Módulo** | Portal Empleado |
| **Menú** | Portal del Empleado |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| USUARIO TRABAJADOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLMisEPIs()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLMisEPIs();
%><%=html_%><%}%>
```

## Notas

- Página base usada como plantilla para duplicar otras páginas del portal (Mis_STOP2, Mis_Activos, etc.).
- Muestra EPIs/ropa/herramientas asignados al empleado con badges de tipo y estado.
