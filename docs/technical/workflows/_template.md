# {Nombre del Workflow}

## Datos generales

| Campo | Valor |
|-------|-------|
| **Link Name** | `{link_name}` |
| **Formulario** | `{form_link_name}` |
| **Trigger** | {Creado/Editado/Envío correcto/Scheduled/Acción usuario en reporte} |
| **Condición** | {Criteria o "Sin condición"} |
| **Estado** | Habilitado / Deshabilitado |
| **Módulo** | {RRHH/PRL/EPI/Asignaciones/Formaciones/Flota/Encuestas/STOP2/Portal} |

## Qué hace

{Descripción en 2-5 líneas de lo que hace el workflow}

## Acciones

### Acción 1: {nombre}
- **Tipo**: Deluge script / Enviar correo / Enviar notificación / etc.
- **Descripción**: {qué hace esta acción}

## Campos que lee

| Campo | Formulario | Tipo |
|-------|-----------|------|
| `{campo}` | `{form}` | {texto/lookup/decision box/etc.} |

## Campos que escribe

| Campo | Formulario | Valor |
|-------|-----------|-------|
| `{campo}` | `{form}` | {descripción del valor} |

## Dependencias

- **Lookups**: {campos lookup que usa}
- **Funciones**: {funciones Deluge que invoca}
- **Otros workflows**: {workflows que se disparan como consecuencia}

## Notas / Bugs conocidos

- {notas relevantes}
