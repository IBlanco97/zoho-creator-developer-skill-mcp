# Encuesta Interna

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `Encuesta_Interna` |
| **Display Name** | Encuesta Interna |
| **Módulo** | Encuestas Internas |
| **Registros aprox.** | Bajo (decenas) |

## Campos

| # | Campo | Link Name | Tipo | Obligatorio | Notas |
|---|-------|-----------|------|-------------|-------|
| 1 | Título | `Titulo` | Single Line | Sí | Nombre visible de la encuesta |
| 2 | Descripción | `Descripcion` | Multi Line | No | Texto explicativo mostrado al empleado |
| 3 | Estado EI | `Estado_EI` | Picklist | Sí | Valores: `Activa`, `Borrador`, `Cerrada` |
| 4 | Fecha Creación EI | `Fecha_Creacion_EI` | Date | No | |
| 5 | Num Preguntas | `Num_Preguntas` | Number | No | Calculado automáticamente por W4 |
| 6 | Single_Line | `Single_Line` | Single Line | No | **ELIMINAR** — campo sobrante de la creación |

## Lookups (campos de referencia)

Ninguno.

## Subformularios

Ninguno.

## Workflows asociados

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `W4_ActualizarContador` | `Pregunta_EI` on add/delete | Actualiza `Num_Preguntas` contando `Pregunta_EI[Encuesta_EI == id]` |

## Reportes

| Reporte | Link Name | Tipo | Filtro |
|---------|-----------|------|--------|
| Encuesta Interna Report | `Encuesta_Interna_Report` | Estándar | — |

## Notas

- `Estado_EI` controla la visibilidad: solo las encuestas `Activa` se muestran a empleados en `Mis_Encuestas`.
- `Num_Preguntas` es un campo desnormalizado — se mantiene sincronizado via W4 para evitar queries extra en las funciones HTML.
- Pendiente: eliminar campo `Single_Line` sobrante.
