# Actualizar Conversación en Mensaje

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Actualizar_Conversacion_En_Mensaje` |
| **Formulario** | `Mensaje` |
| **Trigger** | Creado → Envío de formulario correcto |
| **Condición** | Sin condición |
| **Estado** | Habilitado |
| **Módulo** | RRHH — Mensajería |

## Qué hace

Al crear un nuevo mensaje, actualiza el campo `ltimo_Mensaje` en el registro `Conversaci_n` del técnico correspondiente. Esto permite que la lista de conversaciones muestre el mensaje más reciente.

## Acciones

### Acción 1: Deluge Script
- **Tipo**: Deluge script
- **Código**: `for each conv in Conversaci_n[T_cnico == input.Tecnico] { conv.ltimo_Mensaje = input.ID; }`

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `Tecnico` | `Mensaje` (input) | Lookup → `Nuevo_Empleado` |

## Campos que escribe

| Campo | Formulario | Valor |
|-------|-----------|-------|
| `ltimo_Mensaje` | `Conversaci_n` | `input.ID` (ID del mensaje recién creado) |

## Dependencias

Ninguna.

## Notas / Bugs conocidos

- **Naming mismatch**: `Mensaje.Tecnico` (sin acento) vs `Conversaci_n.T_cnico` (con acento). La query usa `T_cnico == input.Tecnico` — Zoho resuelve la comparación correctamente a pesar de la diferencia de encoding.
- Usa `for each` loop obligatoriamente — batch-update inline `Conversaci_n[criteria].ltimo_Mensaje = x` falla con "Improper Statement Error" porque `ltimo_` empieza con minúscula.
