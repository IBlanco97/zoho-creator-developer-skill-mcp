# Encuestas EI Admin

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Encuestas_EI_Admin` |
| **componentId** | — (no registrado en memoria) |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Encuestas_EI_Admin` |
| **Módulo** | Encuestas Internas |
| **Menú** | Sección admin (Encuestas) |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |
| SUPER ADMINISTRADOR | Sí |
| SUPERVISOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| (nombre snippet) | — | `Calendario52HTML.DevolverHTMLEncuestasAdmin()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLEncuestasAdmin();
%><%=html_%><%}%>
```

## Notas

- Panel de gestión: crear encuestas, ver estado (activa/borrador/cerrada), acceder a preguntas y resultados.
- Filtros CSS-only por estado (Todas/Activas/Borradores/Cerradas).
- Botón "Ver Resultados" solo aparece si la encuesta tiene ≥1 respuesta.
