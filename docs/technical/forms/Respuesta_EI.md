# Respuesta EI

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Respuesta_EI` |
| **Display Name** | Respuesta EI |
| **Módulo** | Encuestas Internas |
| **Registros aprox.** | En crecimiento (1 por empleado×encuesta) |

## Campos

| # | Campo | Link Name | Tipo | Obligatorio | Notas |
|---|-------|-----------|------|-------------|-------|
| 1 | Encuesta EI Resp | `Encuesta_EI_Resp` | Lookup (→ `Encuesta_Interna`) | Sí | Se pasa via URL: `#Form:Respuesta_EI?Encuesta_EI_Resp={id}` |

## Lookups (campos de referencia)

| Campo | Apunta a | Campo mostrado |
|-------|---------|----------------|
| `Encuesta_EI_Resp` | `Encuesta_Interna` | `Titulo` |

## Subformularios

| Subform | Link Name | Campos |
|---------|-----------|--------|
| Detalle Respuesta EI | `Detalle_Respuesta_EI` | `Pregunta_ID_DR` (Number), `Texto_Pregunta_DR` (Single Line), `Tipo_DR` (Single Line), `Respuesta_Texto_DR` (Multi Line), `Respuesta_Escala_DR` (Number) |

**Subform ref**: `ZC_SUBFORM_150`

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `W1_PoblarSubform` | Carga del formulario (on load) | Puebla `Detalle_Respuesta_EI` con las preguntas de la encuesta |
| `W2_CrearCompletada_EI` | Creado → Envío correcto | Crea registro en `Completada_EI` para marcar encuesta como contestada |

## Reportes

| Reporte | Link Name | Tipo | Filtro |
|---------|-----------|------|--------|
| — | — | — | No tiene reporte dedicado; se consulta desde `DevolverHTMLResultadosEI` |

## Notas

- **Anonimato**: El formulario no guarda quién respondió. La trazabilidad se mantiene solo en `Completada_EI` (email del empleado) para evitar respuestas duplicadas, pero no se vincula a las respuestas individuales.
- **Subform constructor bug**: `Detalle_Respuesta_EI()` es rechazado por el App IDE lint pero funciona en el Workflow Builder. Para editar W1, usar siempre Workflow Builder, no App IDE.
- **`Pregunta_ID_DR` overflow via API**: Campo Number en subform rechaza IDs Zoho de 19 dígitos vía REST API (`"has exceeded its maximum digits"`). Internamente en Deluge funciona. Al testear vía API, omitir este campo.
- W1 on-load tiene limitación: `input.Encuesta_EI_Resp` puede ser `null` si el lookup no se pasa correctamente via URL params.
