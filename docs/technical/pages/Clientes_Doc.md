# Clientes Doc

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Clientes_Doc` |
| **componentId** | `4790826000001031011` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Clientes_Doc` |
| **Módulo** | PRL / CAE |
| **Menú** | PRL |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Roles RRHH | Sí (5 roles admin) |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLClientesDoc()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLClientesDoc();
%><%=html_%><%}%>
```

## Notas

- También embebido en `Tablero_PRL` como snippet `Clientes_Doc_Html2`.
- 122 clientes, 139 cards en producción.
- Botón "Ver Docs" navega a `#Page:Documentaci_n_del_Cliente?ClienteID={id}`.
