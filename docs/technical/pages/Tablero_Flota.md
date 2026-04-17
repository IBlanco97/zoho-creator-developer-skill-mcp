# Tablero Flota

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Tablero_Flota` |
| **componentId** | — |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Tablero_Flota` |
| **Módulo** | Flota |
| **Menú** | Flota |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Roles RRHH admin | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLTableroFlota()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLTableroFlota();
%><%=html_%><%}%>
```

## Notas

- 4 KPIs + filtros CSS-only + cards de vehículos.
