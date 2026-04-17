# Mensaje

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Mensaje` |
| **Display Name** | Mensaje |
| **Módulo** | RRHH — Mensajería |
| **Registros aprox.** | En crecimiento |

## Campos principales

| # | Campo | Link Name | Tipo | Notas |
|---|-------|-----------|------|-------|
| 1 | Tecnico | `Tecnico` | Lookup → `Nuevo_Empleado` | **Sin acento** en link name (vs `T_cnico` en Conversación) |
| 2 | Es Respuesta | `Es_Respuesta` | Picklist | "SI" / "NO" — distingue mensajes del empleado vs respuestas RRHH |
| 3 | Leído | `Le_do` | Checkbox | Valor: "Leído" cuando marcado. Usado para KPI mensajes no leídos |
| 4 | Contenido | — | Multi Line | Texto del mensaje |

## Lookups

| Campo | Apunta a | Campo mostrado |
|-------|---------|----------------|
| `Tecnico` | `Nuevo_Empleado` | Nombre |

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `Actualizar_Conversacion_En_Mensaje` | Creado → Envío correcto | Actualiza `Conversaci_n[T_cnico == input.Tecnico].ltimo_Mensaje = input.ID` |

## Notas

- **Naming inconsistency**: `Tecnico` (sin acento) en este form vs `T_cnico` (con acento) en `Conversaci_n`. Esto requiere queries diferentes: `Mensaje[Tecnico == empId]` vs `Conversaci_n[T_cnico == empId]`.
- Campo `Le_do` (checkbox): en queries Deluge, `Le_do != "Leído"` NO captura registros con `Le_do = null`. Fix: iterar todos y comprobar con `if(msg.Le_do != "Leído")` dentro del loop (el `if` de Deluge sí evalúa null como `true` en `!=`).
- Chat RRHH marca como leídos al abrir la conversación (`DevolverHTMLChatRRHH` actualiza `Le_do = "Leído"` + resetea `Conversaci_n.Mensajes_no_le_dos = 0`).
