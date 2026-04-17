# Pregunta EI

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Pregunta_EI` |
| **Display Name** | Pregunta EI |
| **Módulo** | Encuestas Internas |
| **Registros aprox.** | Bajo (decenas, ~5-10 por encuesta) |

## Campos

| # | Campo | Link Name | Tipo | Obligatorio | Notas |
|---|-------|-----------|------|-------------|-------|
| 1 | Encuesta EI | `Encuesta_EI` | Lookup (→ `Encuesta_Interna`) | Sí | |
| 2 | Texto Pregunta | `Texto_Pregunta` | Single Line | Sí | Texto completo de la pregunta |
| 3 | Tipo Pregunta | `Tipo_Pregunta` | Picklist | Sí | Valores: `Texto`, `Escala 1-5` |
| 4 | Orden | `Orden` | Number | No | Define el orden de presentación (sort asc) |

## Lookups (campos de referencia)

| Campo | Apunta a | Campo mostrado |
|-------|---------|----------------|
| `Encuesta_EI` | `Encuesta_Interna` | `Titulo` |

## Subformularios

Ninguno.

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `W4_ActualizarContador` | Creado/Eliminado → Envío correcto | Cuenta preguntas de la encuesta y actualiza `Encuesta_Interna.Num_Preguntas` |

## Reportes

| Reporte | Link Name | Tipo | Filtro |
|---------|-----------|------|--------|
| Pregunta EI Report | `Pregunta_EI_Report` | Estándar | Filtrable por `Encuesta_EI` (usado desde EncuestasAdmin: `#Report:Pregunta_EI_Report?Encuesta_EI={id}`) |

## Notas

- `Tipo_Pregunta` determina cómo se renderiza la respuesta en `ResultadosEI`: `Texto` muestra lista de respuestas libres, `Escala 1-5` muestra barras horizontales con promedio.
- El campo `Orden` se usa en `sort by Orden asc` tanto en W1 (poblar subform) como en `ResultadosEI` (mostrar resultados).
