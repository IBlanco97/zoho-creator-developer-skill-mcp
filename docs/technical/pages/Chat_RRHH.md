# Chat RRHH

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Chat_RRHH` |
| **componentId** | `4790826000001017121` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Chat_RRHH?TecnicoNo={empId}` |
| **Módulo** | RRHH — Mensajería |
| **Menú** | No aparece en menú (se accede desde Lista_Conversaciones o reporte) |
| **Origen** | Duplicada de `Mis_Mensajes2` |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |
| RESPONSABLE CAE | Sí |
| SUPER ADMINISTRADOR | Sí |
| SUPERVISOR | Sí |
| OPERARIO CAE | Sí |
| USUARIO TRABAJADOR | **No** |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLChatRRHH(tecId_)` |

## Variables de página

| Variable | Tipo | Uso |
|----------|------|-----|
| `TecnicoNo` | Number | ID del técnico/empleado. Se pasa via URL: `?TecnicoNo={empId}` |

## Código del Snippet

```
<%{
  tecId_ = input.TecnicoNo;
  html_ = thisapp.Calendario52HTML.DevolverHTMLChatRRHH(tecId_);
%><%=html_%><%}%>
```

## Notas

- Vista admin del chat — efecto secundario: marca mensajes como leídos al abrirse.
- El workflow `Abrir_Historial_de_Conver` navega aquí desde el reporte de conversaciones.
