# DevolverHTMLEncuestasAdmin

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLEncuestasAdmin` |
| **functionId** | `4790826000001053409` |
| **Tipo** | HTML Page |
| **Página asociada** | `Encuestas_EI_Admin` |
| **Roles con acceso** | Gestor RRHH, SUPER ADM, SUPERVISOR |
| **Backup local** | `deluge-drafts/DevolverHTMLEncuestasAdmin.deluge` |

## Qué hace

Genera el panel de administración de encuestas internas. Muestra todas las encuestas (activas, borradores, cerradas) con KPIs, filtros CSS-only por estado, y acciones por cada encuesta (editar, ver preguntas, ver resultados).

## Parámetros

Sin parámetros.

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Respuesta_EI` | `ID != 0` (todas) | `Encuesta_EI_Resp` (para contar respuestas por encuesta) |
| `Encuesta_Interna` | `ID != 0` (sort by `ID desc`) | `ID`, `Titulo`, `Descripcion`, `Estado_EI`, `Num_Preguntas`, `Fecha_Creacion_EI` |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
.ea (contenedor principal)
├── .hd (header con botón "+ Nueva Encuesta" → #Form:Encuesta_Interna)
├── .kr (4 KPIs: Total, Activas, Borradores, Respuestas)
├── Filtros CSS-only (radio buttons: Todas / Activas / Borradores / Cerradas)
│   └── Usa #fa/#fb/#fc/#fd checked ~ .cnt .cd.ba/.bb/.bc display toggle
└── .cnt (cards)
    └── .cd (card por encuesta, clase .ba/.bb/.bc según estado)
        ├── título + badge estado (verde/naranja/rojo)
        ├── descripción
        ├── meta: "{n} preguntas", "{n} respuestas", "Creada: {fecha}"
        └── .ac (acciones):
            ├── "Editar" → #Form:Encuesta_Interna?recLinkID={id}&viewLinkName=...
            ├── "Preguntas" → #Report:Pregunta_EI_Report?Encuesta_EI={id}
            └── "Ver Resultados" → #Page:Resultados_EI?EncuestaNo={id} (solo si nResp > 0)
```

**Filtros CSS-only**: Patrón reutilizado en múltiples páginas de la app. Radio inputs ocultos (`display:none`) + `label` como botón + selector `#id:checked ~ .cnt .cd` para show/hide por clase.

**Pre-conteo de respuestas**: Itera todas las `Respuesta_EI` una sola vez, acumula en `respMap` (Map<string,int>), y luego consulta el mapa por cada encuesta — O(n+m) en vez de O(n×m).

## Notas / Bugs conocidos

- `containsKey()` en `respMap` — reemplazado por `get()!=null` en la versión inyectada para pasar lint de App IDE.
- Colores de borde por estado: Activa=verde (#38a169), Borrador=naranja (#dd6b20), Cerrada=rojo (#e53e3e).
