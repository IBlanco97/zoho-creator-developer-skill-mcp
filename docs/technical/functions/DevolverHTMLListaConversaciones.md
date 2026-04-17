# DevolverHTMLListaConversaciones

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLListaConversaciones` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Lista_Conversaciones` |
| **Roles con acceso** | Roles RRHH admin |

## Qué hace

Genera la lista de todas las conversaciones con empleados, mostrando badges de mensajes no leídos. Cada entrada es clicable y navega a `Chat_RRHH`.

## Parámetros

Sin parámetros.

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Conversaci_n` | Todas | `T_cnico` (lookup), `Mensajes_no_le_dos`, `ltimo_Mensaje` |
| `Nuevo_Empleado` | Via dot notation desde `T_cnico` | `Nombre` |

## Formularios que modifica

Ninguno.

## Notas / Bugs conocidos

- Bug corregido línea 78: `c = tecId % 8` → `c = ifnull(tecId, 0).toLong() % 8`. Causa: registros `Conversaci_n` sin `T_cnico` asignado devuelven `null`, y `null % 8` lanzaba "mod operation mismatch of data type expressions".
- Badge de mensajes no leídos usa `conv.Mensajes_no_le_dos` (campo desnormalizado de `Conversaci_n`).
