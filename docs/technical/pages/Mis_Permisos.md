# Mis Permisos

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mis_Permisos` |
| **componentId** | — |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Mis_Permisos` |
| **Módulo** | Portal Empleado |
| **Menú** | Portal del Empleado |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| USUARIO TRABAJADOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLMisPermisos()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLMisPermisos();
%><%=html_%><%}%>
```

## Notas

- Muestra solicitudes de permiso del empleado con estado (SI/NO/Sin Respuesta).
- Botón de nueva solicitud navega a `#Form:Solicitud`.
