# Tablero Formaciones

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Tablero_Formaciones` |
| **componentId** | `4790826000001047015` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Tablero_Formaciones` |
| **Módulo** | Formaciones |
| **Menú** | Formaciones (posición 1) |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |
| SUPER ADMINISTRADOR | Sí |
| SUPERVISOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | `4790826000001047022` | `Calendario52HTML.DevolverHTMLTableroFormaciones()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLTableroFormaciones();
%><%=html_%><%}%>
```

## Notas

- NO tiene acceso RESPONSABLE CAE ni OPERARIO CAE.
