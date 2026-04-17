# Semáforo Caducidades EPI

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Sem_foro_Caducidades_EPI` |
| **componentId** | `4790826000001006621` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Sem_foro_Caducidades_EPI` |
| **Módulo** | PRL / EPI |
| **Menú** | PRL |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLSemaforoCaducidades()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLSemaforoCaducidades();
%><%=html_%><%}%>
```

## Notas

- 562 pills renderizadas en producción.
- Tabla agrupada por técnico con pills coloreadas por estado de caducidad.
