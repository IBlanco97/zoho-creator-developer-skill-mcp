# Mis Encuestas

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mis_Encuestas` |
| **componentId** | — (no registrado en memoria) |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Mis_Encuestas` |
| **Módulo** | Encuestas Internas / Portal Empleado |
| **Menú** | Portal del Empleado |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| USUARIO TRABAJADOR | Sí |
| (otros roles admin para testing) | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| (nombre snippet) | — | `Calendario52HTML.DevolverHTMLMisEncuestas()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLMisEncuestas();
%><%=html_%><%}%>
```

## Notas

- Vista del empleado: muestra encuestas pendientes con botón "Responder" y encuestas completadas con badge verde.
- También muestra encuestas externas (Zoho Survey) si existen en `Encuesta_Survey`.
