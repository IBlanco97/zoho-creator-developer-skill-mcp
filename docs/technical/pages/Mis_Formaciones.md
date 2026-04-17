# Mis Formaciones

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mis_Formaciones` |
| **componentId** | `4790826000001047026` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Mis_Formaciones` |
| **Módulo** | Portal Empleado / Formaciones |
| **Menú** | Portal del Empleado (posición 5) |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| USUARIO TRABAJADOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLMisFormaciones()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLMisFormaciones();
%><%=html_%><%}%>
```

## Notas

- Dos secciones: Próximas formaciones (cards) + Historial (tabla, max 10).
- Membership check manual para lookup list `T_cnicos_a_convocar` (no soporta `contains` en Deluge).
