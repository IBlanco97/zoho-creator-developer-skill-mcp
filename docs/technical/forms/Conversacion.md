# Conversación

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Conversaci_n` |
| **Display Name** | Conversación |
| **Módulo** | RRHH — Mensajería |
| **Registros aprox.** | 1 por empleado (singleton por técnico) |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Técnico | `T_cnico` | Lookup → `Nuevo_Empleado` | **Con acento** (é→`_`) — vs `Tecnico` sin acento en `Mensaje` |
| 2 | Mensajes no leídos | `Mensajes_no_le_dos` | Number | Counter desnormalizado, reseteado por `DevolverHTMLChatRRHH` |
| 3 | Último Mensaje | `ltimo_Mensaje` | Number / Lookup | ID del último mensaje, actualizado por workflow |

## Lookups

| Campo | Apunta a | Campo mostrado |
|-------|---------|----------------|
| `T_cnico` | `Nuevo_Empleado` | Nombre |

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `Abrir_Historial_de_Conver` | Acción en reporte `Conversaci_n_Report` | Navega a `#Page:Chat_RRHH?TecnicoNo={T_cnico}` |

## Reportes

| Reporte | Link Name | Tipo | Notas |
|---------|-----------|------|-------|
| Conversación Report | `Conversaci_n_Report` | Estándar | Lista de conversaciones con badge de mensajes no leídos |

## Notas

- Actúa como **índice de conversaciones** — un registro por empleado.
- `Mensajes_no_le_dos` es un campo desnormalizado que se incrementa al recibir mensajes y se resetea a 0 cuando RRHH abre la conversación (`DevolverHTMLChatRRHH`).
- Bug corregido en `DevolverHTMLListaConversaciones` línea 78: `c = tecId % 8` fallaba con `null` → fix: `c = ifnull(tecId, 0).toLong() % 8`.
- `ltimo_Mensaje` empieza con minúscula — batch-update inline `Form[criteria].ltimo_Mensaje = x` falla con "Improper Statement Error". Fix: usar `for each` loop.
