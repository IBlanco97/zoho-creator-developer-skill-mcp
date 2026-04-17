# Notificar Solicitud Permiso a RRHH

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Notificar_Solicitud_Permi` |
| **Formulario** | `Solicitud` |
| **Trigger** | Creado → Envío de formulario correcto |
| **Condición** | `Configuraci_n_General.Notificar_nuevas_solicitudes_a_personal_correspondiente == "Activado"` |
| **Estado** | Habilitado |
| **Módulo** | RRHH — Permisos / Notificaciones |
| **Backup local** | `deluge-drafts/SolicitudPermiso-NotificarSolicitudPermisoARRHH.deluge` |

## Qué hace

Cuando un empleado envía una solicitud de permiso, notifica al personal RRHH configurado en `Configuraci_n_General` a través de 3 canales: push notification, WhatsApp y email HTML. Los canales activos se controlan desde `config.V_as_de_Notificaci_n1`.

## Acciones

### Acción 1: Deluge Script — Notificación multicanal
- **Tipo**: Deluge script
- **Canales**:
  - **Push**: `zoho.pushNotification` a cada persona de `Personal_a_Notificar_Solicitudes_de_Permisos`
  - **WhatsApp**: via `thisapp.NuevoEmpleado.whatsapp` (función helper)
  - **Email**: HTML inline con header `#1C3A5E`, tabla de datos (Trabajador, Tipo, Desde, Hasta, Observaciones, Fecha), CTA, footer
- **Deduplicación**: destinatarios deduplicados por `Official_Email`, `Correo_Electr_nico`, `Mail_Portal_Empleado`

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `Trabajador_Solicitante` | `Solicitud` | Lookup → `Nuevo_Empleado` |
| `Tipo` | `Solicitud` | Picklist |
| `Fecha_de_comienzo`, `Fecha_de_Fin` | `Solicitud` | Date |
| `Observaciones` | `Solicitud` | Multi Line |
| `Notificar_nuevas_solicitudes...` | `Configuraci_n_General` | Picklist |
| `Personal_a_Notificar_Solicitudes_de_Permisos` | `Configuraci_n_General` | Lookup list |
| `V_as_de_Notificaci_n1` | `Configuraci_n_General` | Multi-select |

## Campos que escribe

Ninguno.

## Dependencias

- **Funciones**: `thisapp.NotificacionesMail.GenerarFilaDato` (helper para filas HTML de email), `thisapp.NuevoEmpleado.whatsapp` (envío WhatsApp)
- **Config**: Toda la lógica está gateada por `Configuraci_n_General`

## Notas / Bugs conocidos

- Bug evitado: campo `Observaciones` se creyó inexistente en `Solicitud` — sí existe.
- El email usa `thisapp.NotificacionesMail.GenerarFilaDato` como helper para generar filas `<tr><td>` consistentes.
