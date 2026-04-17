# Mis Activos

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mis_Activos` |
| **componentId** | `4790826000001028147` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Mis_Activos` |
| **Módulo** | Portal Empleado |
| **Menú** | Portal del Empleado |
| **Origen** | Duplicada de `Inventario_EPI` |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| USUARIO TRABAJADOR | Sí (profileId: `4790826000000171117`) |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLMisActivos()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLMisActivos();
%><%=html_%><%}%>
```

## Notas

- Muestra activos con `Estado=="Activa"` filtrados por email del trabajador.
- Badges de tipo (EPI/ROPA/HERR) + unidades + serie + fecha desde.
