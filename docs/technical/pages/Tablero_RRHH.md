# Tablero RRHH

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Tablero_RRHH` |
| **componentId** | `4790826000000987067` |
| **URL** | `https://creatorapp.zoho.com/formacion11/human-resource-management/#Page:Tablero_RRHH` |
| **Módulo** | RRHH |
| **Menú** | Sección principal RRHH |

## Roles con acceso (TAB permission)

| Rol | Acceso |
|-----|--------|
| Gestor RRHH | Sí |
| SUPER ADMINISTRADOR | Sí |
| SUPERVISOR | Sí |

## Snippets HTML

Página con múltiples componentes ZML (KPIs nativos de Zoho + snippets HTML embebidos). Los KPIs son clicables y navegan a los reportes/páginas correspondientes.

## Variables de página

Ninguna.

## Notas

- Dashboard principal de RRHH con KPIs de empleados, solicitudes pendientes, mensajes no leídos, etc.
- Sprint mejoras RRHH (M-BUG-1/2/3, M-UX-3) completado — KPIs clicables ya implementados (C5).
- KPI "Mensajes Empleados" usa criteria `Le_do != "Leído" || Le_do is null` en el reporte `Copy_of_Cliente_Empleado`.
