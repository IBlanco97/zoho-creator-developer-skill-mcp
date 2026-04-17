# W2 Crear Completada EI (Respuesta EI — On Submit)

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `W2_CrearCompletada_EI` |
| **Formulario** | `Respuesta_EI` |
| **Trigger** | Creado → Envío de formulario correcto |
| **Condición** | `input.Encuesta_EI_Resp != null && != 0` |
| **Estado** | Habilitado |
| **Módulo** | Encuestas Internas |
| **Backup local** | `deluge-drafts/W2-RespuestaEI-OnSubmit.deluge` |

## Qué hace

Al enviar exitosamente una respuesta a una encuesta, crea un registro en `Completada_EI` vinculando el email del empleado con la encuesta. Esto permite que `DevolverHTMLMisEncuestas` sepa que el empleado ya respondió y muestre el badge "Completada" en vez de "Pendiente".

## Acciones

### Acción 1: Deluge Script — Insert Completada_EI
- **Tipo**: Deluge script (9 líneas)
- **Descripción**: `insert into Completada_EI [Email_Empleado_CE = zoho.loginuserid, Encuesta_EI_CE = encuestaId]`

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `Encuesta_EI_Resp` | `Respuesta_EI` (input) | Lookup → Encuesta_Interna |

## Campos que escribe

| Campo | Formulario | Valor |
|-------|-----------|-------|
| `Email_Empleado_CE` | `Completada_EI` | `zoho.loginuserid` |
| `Encuesta_EI_CE` | `Completada_EI` | `input.Encuesta_EI_Resp` |

## Dependencias

- **Lookups**: Ninguno adicional
- **Funciones**: Ninguna
- **Otros workflows**: Ninguno

## Notas / Bugs conocidos

- Workflow simple y robusto. No hay validación de duplicados — si un empleado responde dos veces la misma encuesta, se crean dos registros en `Completada_EI`. La UI previene esto mostrando "Completada" y ocultando el botón "Responder", pero no hay constraint a nivel de datos.
