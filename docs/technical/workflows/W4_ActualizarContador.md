# W4 Actualizar Contador (Pregunta EI — On Add/Delete)

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `W4_ActualizarContador` |
| **Formulario** | `Pregunta_EI` |
| **Trigger** | Creado o Eliminado → Envío de formulario correcto |
| **Condición** | `input.Encuesta_EI != null && != 0` |
| **Estado** | Habilitado |
| **Módulo** | Encuestas Internas |
| **Backup local** | `deluge-drafts/W4-PreguntaEI-ActualizarContador.deluge` |

## Qué hace

Cada vez que se crea o elimina una pregunta, recuenta el total de preguntas de la encuesta asociada y actualiza el campo `Num_Preguntas` en `Encuesta_Interna`. Esto mantiene el campo desnormalizado sincronizado sin necesidad de contar en cada render de página HTML.

## Acciones

### Acción 1: Deluge Script — Recount + Update
- **Tipo**: Deluge script (13 líneas)
- **Descripción**: Cuenta `Pregunta_EI[Encuesta_EI == encuestaId]` con counter manual (`cnt`), luego actualiza `Encuesta_Interna[ID == encuestaId].Num_Preguntas = cnt` via `for each` loop.

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `Encuesta_EI` | `Pregunta_EI` (input) | Lookup → Encuesta_Interna |

## Campos que escribe

| Campo | Formulario | Valor |
|-------|-----------|-------|
| `Num_Preguntas` | `Encuesta_Interna` | Conteo de preguntas de la encuesta |

## Dependencias

- **Lookups**: `Pregunta_EI.Encuesta_EI` → `Encuesta_Interna`
- **Funciones**: Ninguna
- **Otros workflows**: Ninguno

## Notas / Bugs conocidos

- Usa counter manual (`cnt = cnt + 1` en loop) en vez de `.size()` — patrón estándar en la app para evitar problemas con `.size()` en queries Deluge que pueden devolver empty set.
- Usa `for each enc in Encuesta_Interna[ID == encuestaId]` para actualizar el registro padre — patrón counter guard estándar.
