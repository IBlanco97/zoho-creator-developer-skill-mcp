# Ficha Empleado

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Ficha_Empleado` |
| **componentId** | `4790826000001013095` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Ficha_Empleado?EmpNo={empId}` |
| **Módulo** | RRHH |
| **Menú** | No aparece en menú (se accede desde Tablero RRHH o reportes) |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |
| SUPER ADMINISTRADOR | Sí |
| SUPERVISOR | Sí |

## Snippets HTML

| Snippet | htmlViewId | Función que llama |
|---------|-----------|-------------------|
| — | — | `Calendario52HTML.DevolverHTMLFichaEmpleado(empId_)` |

## Variables de página

| Variable | Tipo | Uso |
|----------|------|-----|
| `EmpNo` | Number | ID del empleado. ⚠️ NO `ID` — palabra reservada en Zoho |

## Código del Snippet

```
<%{
  empId_ = input.EmpNo;
  html_ = thisapp.Calendario52HTML.DevolverHTMLFichaEmpleado(empId_);
%><%=html_%><%}%>
```

## Notas

- Header nombre+empresa, pills EPI con colores por Estado, sección Próximas Semanas y Solicitudes Pendientes.
- Variable de página `EmpNo` (NO `ID` — es palabra reservada en Zoho).
