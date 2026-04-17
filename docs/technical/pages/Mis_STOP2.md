# Mis STOP2

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mis_STOP2` |
| **componentId** | `4790826000001053747` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Mis_STOP2` |
| **Módulo** | STOP2 / Portal Empleado |
| **Menú** | Portal del Empleado (después de "Mis Encuestas") |
| **Origen** | Duplicada de `Mis_EPIs` |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| USUARIO TRABAJADOR | Sí |
| RESPONSABLE CAE | Sí |
| Gestor RRHH | Sí |
| SUPER ADMINISTRADOR | Sí |
| SUPERVISOR | Sí |
| OPERARIO CAE | Sí |

Todos los 6 roles tienen acceso.

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| `MisSTOP2Html` | `4790826000001053754` | `Calendario52HTML.DevolverHTMLMisSTOP2()` |

**workflowid del snippet:** `4790826000001053755`

## Variables de página

Ninguna (la función no recibe parámetros).

## Código del Snippet

```
<%{
  html_ = thisapp.Calendario52HTML.DevolverHTMLMisSTOP2();
%><%=html_%><%}%>
```

## Notas

- Página creada por duplicación de `Mis_EPIs` (patrón estándar para crear páginas con HTML Snippet).
- La función identifica al empleado internamente via `zoho.loginuserid`.
- El botón "+ Nuevo STOP2" dentro del HTML navega a `#Form:STOP2_Analisis_Previo`.
