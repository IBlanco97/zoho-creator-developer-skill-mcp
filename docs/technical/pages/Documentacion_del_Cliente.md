# Documentación del Cliente

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Documentaci_n_del_Cliente` |
| **componentId** | — |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Documentaci_n_del_Cliente?ClienteID={id}` |
| **Módulo** | PRL / CAE |
| **Menú** | No aparece en menú (se accede desde Clientes_Doc) |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Roles RRHH | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| `DocClienteHtml` | `4790826000001028053` | `Calendario52HTML.DevolverHTMLDocCliente(clienteId_)` |

## Variables de página

| Variable | Tipo | Uso |
|----------|------|-----|
| `ClienteID` | Number | ID del cliente. Se pasa via URL |

## Código del Snippet

```
<%{
  clienteId_ = input.ClienteID;
  html_ = thisapp.Calendario52HTML.DevolverHTMLDocCliente(clienteId_);
%><%=html_%><%}%>
```

## Notas

- Vista detallada de documentación de un cliente: 6 KPIs, 2 semáforos, barra de progreso, tablas agrupadas.
- Rediseñada desde cero (la versión anterior era un reporte nativo).
