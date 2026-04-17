# Configuración General

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Configuracion_General` |
| **componentId** | `4790826000001029132` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Configuracion_General` |
| **Módulo** | Configuración |
| **Menú** | Administración |
| **Origen** | Duplicada de `Ficha_Empleado` |

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
| — | — | `Configuracion.MostrarConfiguracion()` |

## Variables de página

Ninguna.

## Código del Snippet

```
<%{
  html_ = thisapp.Configuracion.MostrarConfiguracion();
%><%=html_%><%}%>
```

## Notas

- Panel de 7 secciones con badges de estado.
- Botón "Editar" abre el formulario singleton en modo edición.
- Namespace `Configuracion` (no `Calendario52HTML`).
