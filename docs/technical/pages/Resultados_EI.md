# Resultados EI

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Resultados_EI` |
| **componentId** | — (no registrado en memoria) |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Resultados_EI?EncuestaNo={id}` |
| **Módulo** | Encuestas Internas |
| **Menú** | No aparece en menú (se accede desde `Encuestas_EI_Admin` via botón "Ver Resultados") |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |
| SUPER ADMINISTRADOR | Sí |
| SUPERVISOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| (nombre snippet) | `4790826000001053433` | `Calendario52HTML.DevolverHTMLResultadosEI(encuestaId_)` |

## Variables de página

| Variable | Tipo | Uso |
|----------|------|-----|
| `EncuestaNo` | Number | ID de la encuesta a mostrar. Se pasa via URL: `?EncuestaNo={id}` |

## Código del Snippet

```
<%{
  encuestaId_ = input.EncuestaNo;
  html_ = thisapp.Calendario52HTML.DevolverHTMLResultadosEI(encuestaId_);
%><%=html_%><%}%>
```

## Notas

- Página de destino desde `Encuestas_EI_Admin` → botón "Ver Resultados".
- El snippet original tenía la función equivocada (`DevolverHTMLSemaforoCaducidades`) porque la página fue duplicada de `Mis_EPIs` — fue corregido via POST directo a `storeFunction`.
- Enlace "← Volver a Encuestas" navega de vuelta a `#Page:Encuestas_EI_Admin`.
