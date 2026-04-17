# DevolverHTMLChatEmpleado

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLChatEmpleado` |
| **functionId** | — (no registrado) |
| **Tipo** | HTML Page |
| **Página asociada** | `Mis_Mensajes2` (componentId: `4790826000001017051`, pageFuncWfId: `4790826000001017069`) |
| **Roles con acceso** | USUARIO TRABAJADOR |
| **Backup local** | No disponible |

## Qué hace

Genera la página de mensajería del empleado con estilo WhatsApp. Muestra el historial de mensajes entre el empleado y RRHH: burbujas verdes para mensajes del empleado, burbujas blancas con label "RRHH" para respuestas. Incluye botón para enviar nuevo mensaje.

## Parámetros

Sin parámetros (usa `zoho.loginuserid`).

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Empleado` | `Official_Email == uid \|\| Mail_Portal_Empleado == uid \|\| Correo_Electr_nico == uid` | `ID`, `Nombre` |
| `Mensaje` | `Tecnico == empId` | Contenido del mensaje, fecha, `Es_Respuesta`, autor |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
Header tipo WhatsApp
├── Burbujas de chat
│   ├── Verde: mensajes del empleado
│   └── Blanca con label "RRHH": respuestas de RRHH
└── Botón "✉ Enviar nuevo mensaje" → #Form:Mensaje
```

## Notas / Bugs conocidos

- La página `Mis_Mensajes2` es la versión correcta. Existen páginas vacías `Mis_Mensajes` y `Mis_Mensajes1` que deben eliminarse manualmente (sin TAB permission en portal, no afectan a usuarios).
- El snippet original tenía la función equivocada (`DevolverHTMLSemaforoCaducidades`) por ser duplicada de otra página — fue corregido.
