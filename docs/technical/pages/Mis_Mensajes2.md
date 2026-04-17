# Mis Mensajes (Chat Empleado)

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mis_Mensajes2` |
| **componentId** | `4790826000001017051` |
| **pageFuncWfId** | `4790826000001017069` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Mis_Mensajes2` |
| **Módulo** | Portal Empleado / Mensajería |
| **Menú** | Portal del Empleado |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| USUARIO TRABAJADOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLChatEmpleado()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLChatEmpleado();
%><%=html_%><%}%>
```

## Notas

- UI tipo WhatsApp: burbujas verdes (empleado) y blancas con label "RRHH" (respuestas).
- Existen páginas vacías `Mis_Mensajes` y `Mis_Mensajes1` que deben eliminarse manualmente en el IDE (no tienen TAB permission en portal, no afectan usuarios).
- El snippet original era incorrecto (heredado de duplicación) — fue corregido a `DevolverHTMLChatEmpleado`.
