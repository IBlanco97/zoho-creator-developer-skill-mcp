# DevolverHTMLChatRRHH

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLChatRRHH` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Chat_RRHH` (componentId: `4790826000001017121`) |
| **Roles con acceso** | Gestor RRHH, RESPONSABLE CAE, SUPER ADM, SUPERVISOR, OPERARIO CAE (NO USUARIO TRAB) |

## Qué hace

Genera la vista admin tipo WhatsApp de la conversación con un técnico específico. Muestra todos los mensajes ordenados cronológicamente, con burbujas diferenciadas para empleado y RRHH. **Efecto secundario**: al ejecutarse, marca todos los mensajes como leídos y resetea el contador de mensajes no leídos en la conversación.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `empId` | int | ID del técnico/empleado cuya conversación mostrar |

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Empleado` | `ID == empId` | `Nombre` |
| `Mensaje` | `Tecnico == empId` | Contenido, fecha, `Es_Respuesta`, autor |

## Formularios que modifica

| Formulario | Acción | Campos |
|-----------|--------|--------|
| `Mensaje` | Update (mark as read) | `Le_do = "Leído"` en todos los `Mensaje[Tecnico == empId]` no leídos |
| `Conversaci_n` | Update | `Mensajes_no_le_dos = 0` en `Conversaci_n[T_cnico == empId]` |

## Estructura HTML generada

```
Header con initials del empleado + "Mensajes con {nombre}"
├── Burbujas de chat cronológicas
│   ├── Blancas: mensajes del empleado
│   └── Verdes con label "RRHH": respuestas RRHH (autor desde Nuevo_Empleado[ID==autor])
└── Footer "Responder" → #Form:Mensaje?Tecnico={empId}&Es_Respuesta=SI
```

## Notas / Bugs conocidos

- **Mark-as-read bug 1**: `Mensaje[Tecnico==empId && Le_do != "Leído"]` NO captura registros con `Le_do=null`. Fix: iterar `Mensaje[Tecnico==empId]` completo + `if(msg.Le_do != "Leído")` dentro del loop.
- **Mark-as-read bug 2**: `Nuevo_Empleado[ID==empId]` sobre empty set + `.ID == null` lanza excepción. Fix: `empId==0` guard + counter loop `empFound`.
- **Regla general**: `Form[ID==x].Field` sobre empty set SIEMPRE lanza excepción — nunca acceder campos sin counter guard.
