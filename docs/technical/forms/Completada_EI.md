# Completada EI

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Completada_EI` |
| **Display Name** | Completada EI |
| **Módulo** | Encuestas Internas |
| **Registros aprox.** | En crecimiento (1 por empleado×encuesta completada) |

## Campos

| # | Campo | Link Name | Tipo | Obligatorio | Notas |
|---|-------|-----------|------|-------------|-------|
| 1 | Email Empleado CE | `Email_Empleado_CE` | Email / Single Line | Sí | `zoho.loginuserid` del empleado que respondió |
| 2 | Encuesta EI CE | `Encuesta_EI_CE` | Lookup (→ `Encuesta_Interna`) | Sí | Encuesta completada |

## Lookups (campos de referencia)

| Campo | Apunta a | Campo mostrado |
|-------|---------|----------------|
| `Encuesta_EI_CE` | `Encuesta_Interna` | `Titulo` |

## Subformularios

Ninguno.

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| — | — | Este form es destino de insert (W2), no tiene workflows propios |

## Reportes

Ninguno dedicado.

## Notas

- Este formulario actúa como **tabla de control de duplicados**: `DevolverHTMLMisEncuestas` consulta `Completada_EI[Email_Empleado_CE == zoho.loginuserid]` para saber qué encuestas ya fueron respondidas por el empleado.
- Se crea automáticamente via W2 al enviar `Respuesta_EI` — no se rellena manualmente.
- Separa la trazabilidad (quién respondió) de las respuestas (anónimas en `Respuesta_EI`).
