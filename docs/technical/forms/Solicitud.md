# Solicitud (Permiso)

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Solicitud` |
| **Display Name** | Nueva Solicitud Permiso |
| **Módulo** | RRHH — Permisos |
| **Registros aprox.** | En crecimiento |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Trabajador Solicitante | `Trabajador_Solicitante` | Lookup → `Nuevo_Empleado` | |
| 2 | Tipo | `Tipo` | Picklist | Tipo de permiso solicitado |
| 3 | Fecha de comienzo | `Fecha_de_comienzo` | Date | |
| 4 | Fecha de Fin | `Fecha_de_Fin` | Date | |
| 5 | Observaciones | `Observaciones` | Multi Line | Texto libre del empleado |
| 6 | (Respuesta RRHH) | — | Picklist | SI / NO / Sin Respuesta |

## Lookups

| Campo | Apunta a | Campo mostrado |
|-------|---------|----------------|
| `Trabajador_Solicitante` | `Nuevo_Empleado` | Nombre |

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `Notificar_Solicitud_Permi` | Creado → Envío correcto | Notifica a RRHH via push, WhatsApp, email. Gateado por `Configuraci_n_General` |

## Notas

- El empleado accede al formulario desde `Mis_Permisos` → botón "+ Nueva Solicitud" → `#Form:Solicitud`.
- La respuesta (SI/NO) la gestiona RRHH desde el reporte.
- Campo `Observaciones` existe en el formulario (bug evitado en N8: se pensó que no existía).
