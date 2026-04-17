# W1 Poblar Subform (Respuesta EI — On Load)

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `W1_PoblarSubform` |
| **Formulario** | `Respuesta_EI` |
| **Trigger** | Creado → Carga del formulario (on load) |
| **Condición** | `input.Encuesta_EI_Resp != null && != 0` |
| **Estado** | Habilitado |
| **Módulo** | Encuestas Internas |
| **Backup local** | `deluge-drafts/W1-RespuestaEI-OnLoad.deluge` |

## Qué hace

Al cargar el formulario `Respuesta_EI`, lee las preguntas de la encuesta vinculada y genera automáticamente las filas del subformulario `Detalle_Respuesta_EI`, una por cada pregunta. El empleado solo necesita rellenar las respuestas.

## Acciones

### Acción 1: Deluge Script — Poblar subform
- **Tipo**: Deluge script
- **Descripción**: Itera `Pregunta_EI[Encuesta_EI == encuestaId]` ordenado por `Orden asc`, crea filas `Detalle_Respuesta_EI()` con los datos de cada pregunta (ID, texto, tipo) y las inserta en `input.Detalle_Respuesta_EI`.

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `Encuesta_EI_Resp` | `Respuesta_EI` (input) | Lookup → Encuesta_Interna |
| `ID` | `Pregunta_EI` | Auto-number |
| `Texto_Pregunta` | `Pregunta_EI` | Single Line |
| `Tipo_Pregunta` | `Pregunta_EI` | Picklist |

## Campos que escribe

| Campo | Formulario | Valor |
|-------|-----------|-------|
| `Pregunta_ID_DR` | Subform `Detalle_Respuesta_EI` | `p.ID` |
| `Texto_Pregunta_DR` | Subform `Detalle_Respuesta_EI` | `p.Texto_Pregunta` |
| `Tipo_DR` | Subform `Detalle_Respuesta_EI` | `p.Tipo_Pregunta` |
| `Respuesta_Texto_DR` | Subform `Detalle_Respuesta_EI` | `""` (vacío, para que el empleado rellene) |
| `Respuesta_Escala_DR` | Subform `Detalle_Respuesta_EI` | `0` (vacío, para que el empleado rellene) |

## Dependencias

- **Lookups**: `Respuesta_EI.Encuesta_EI_Resp` → `Encuesta_Interna`
- **Funciones**: Ninguna
- **Otros workflows**: Ninguno

## Notas / Bugs conocidos

- **Constructor `Detalle_Respuesta_EI()` rechazado por App IDE lint** — error "Not able to find 'Detalle_Respuesta_EI' function". Funciona correctamente desde el Workflow Builder. Para editar este workflow, usar siempre Workflow Builder, no App IDE.
- **Limitación on-load**: `input.Encuesta_EI_Resp` depende de que el lookup se pase via URL params (`?Encuesta_EI_Resp={id}`). Si se abre el formulario sin params, el subform queda vacío.
