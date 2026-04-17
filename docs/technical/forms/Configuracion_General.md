# Configuración General

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Configuraci_n_General` |
| **Display Name** | Configuración General |
| **Módulo** | Configuración |
| **Registros aprox.** | 1 (singleton) |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Notificar nuevas solicitudes | `Notificar_nuevas_solicitudes_a_personal_correspondiente` | Picklist | "Activado" / "Desactivado" |
| 2 | Personal a Notificar Permisos | `Personal_a_Notificar_Solicitudes_de_Permisos` | Lookup list → `Nuevo_Empleado` | Lista de personas RRHH a notificar |
| 3 | Vías de Notificación | `V_as_de_Notificaci_n1` | Multi-select | "WhatsApp", "Correo", "Push" |

Tiene campos adicionales para cada una de las 7 secciones de configuración (Caducidad, Asignaciones, EPIs, Permisos, Mensajes, Bienvenida, WhatsApp).

## Notas

- Formulario singleton — solo hay 1 registro.
- Múltiples workflows leen este formulario para decidir si enviar notificaciones y por qué canal.
- Se accede desde `Configuracion_General` página → botón "Editar" con `recLinkID`.
