# DevolverHTMLMisEncuestas

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLMisEncuestas` |
| **functionId** | `4790826000001053406` |
| **Tipo** | HTML Page |
| **Página asociada** | `Mis_Encuestas` |
| **Roles con acceso** | USUARIO TRABAJADOR (+ roles admin para testing) |
| **Backup local** | `deluge-drafts/DevolverHTMLMisEncuestas.deluge` |

## Qué hace

Genera la página "Mis Encuestas" para el empleado logueado. Muestra encuestas activas divididas en dos secciones: Internas (del sistema de encuestas embebidas) y Externas (Zoho Survey, compatibilidad). Para cada encuesta interna indica si está pendiente o completada, con botón "Responder" si no la ha completado aún.

## Parámetros

Sin parámetros (usa `zoho.loginuserid`).

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Completada_EI` | `Email_Empleado_CE == zoho.loginuserid` | `Encuesta_EI_CE` (ID de encuesta completada) |
| `Encuesta_Interna` | `Estado_EI == "Activa"` | `ID`, `Titulo`, `Descripcion`, `Num_Preguntas` |
| `Encuesta_Survey` | `Estado_de_Encuesta == "Activa"` | `Nombre`, `Enlace_a_la_encuesta_Zoho_Survey1` |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
.me (contenedor principal)
├── .hd (header gradiente #1C3A5E, icono checkbox SVG)
│   └── "Mis Encuestas" + "Responde las encuestas activas de forma anónima"
├── .kr (KPIs flex)
│   ├── .kc.k-o (Pendientes — naranja)
│   ├── .kc.k-g (Completadas — verde)
│   └── .kc.k-b (Externas — azul, solo si cntExt > 0)
└── .cnt (contenido)
    ├── .sh "Encuestas Internas"
    │   └── .cd (card por encuesta, .dn si completada)
    │       ├── título + badge (Pendiente azul / Completada verde)
    │       ├── descripción
    │       ├── "{n} preguntas"
    │       └── botón "Responder" → #Form:Respuesta_EI?Encuesta_EI_Resp={id}
    └── .sh "Encuestas Externas (Zoho Survey)"
        └── .cd (card con badge "Externa" morado, botón "Abrir encuesta" → URL externa)
```

**Detección de completada**: Construye un `Map()` con los IDs de encuestas en `Completada_EI` del usuario. Usa `containsKey(eId.toString())` para marcar cada card.

## Notas / Bugs conocidos

- `containsKey()` funciona en este contexto porque el código se inyectó via App IDE (no todos los métodos de Map pasan el lint — ver feedback_appide_lint).
- Sección de Encuestas Externas (`Encuesta_Survey`) mantiene compatibilidad con el sistema anterior de Zoho Survey.
- Cards completadas tienen `opacity: 0.7` y borde gris (`border-left-color: #a0aec0`).
