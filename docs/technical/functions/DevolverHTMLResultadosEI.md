# DevolverHTMLResultadosEI

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLResultadosEI` |
| **functionId** | `4790826000001053412` |
| **Tipo** | HTML Page |
| **Página asociada** | `Resultados_EI` (variable de página: `EncuestaNo`) |
| **Roles con acceso** | Gestor RRHH, SUPER ADM, SUPERVISOR |
| **Backup local** | `deluge-drafts/DevolverHTMLResultadosEI.deluge` |

## Qué hace

Genera la vista de resultados agregados para una encuesta específica. Muestra cada pregunta con sus respuestas anónimas: para preguntas de texto libre muestra la lista de respuestas, para escala 1-5 muestra barras horizontales coloreadas con conteo y promedio.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `encuestaId` | int | ID de la `Encuesta_Interna` a mostrar. Se pasa via variable de página `EncuestaNo` |

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Encuesta_Interna` | `ID == encuestaId` | `Titulo`, `Descripcion` |
| `Pregunta_EI` | `Encuesta_EI == encuestaId` (sort by `Orden asc`) | `ID`, `Texto_Pregunta`, `Tipo_Pregunta` |
| `Respuesta_EI` | `Encuesta_EI_Resp == encuestaId` | Subform `Detalle_Respuesta_EI`: `Pregunta_ID_DR`, `Tipo_DR`, `Respuesta_Texto_DR`, `Respuesta_Escala_DR` |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
.re (contenedor principal)
├── .hd (header con título de la encuesta + descripción)
│   ├── .hb "{n} respuestas anónimas"
│   └── .bk "← Volver a Encuestas" → #Page:Encuestas_EI_Admin
└── .cnt (preguntas)
    └── .qc (card por pregunta, borde izquierdo azul)
        ├── .qn "Pregunta {n}"
        ├── .qt (texto de la pregunta)
        ├── .qtp (badge tipo: "Texto" o "Escala 1-5")
        └── Contenido según tipo:
            ├── [Escala 1-5] .sb (barras horizontales 5→1)
            │   ├── .sr (fila: label + barra coloreada + conteo)
            │   │   └── Colores: s1=#e53e3e, s2=#dd6b20, s3=#d69e2e, s4=#38a169, s5=#276749
            │   └── .av "Promedio: {x.x} / 5"
            └── [Texto] .rl (lista de respuestas)
                └── .ri (respuesta individual, borde izquierdo gris)
```

**Agregación de datos**: Construye un `pregMap` (Map<preguntaId, Map>) con listas de respuestas texto y contadores de escala. Itera respuestas una sola vez, acumula en las estructuras del mapa, y luego renderiza.

**Cálculo promedio escala**: `(escalaTotal * 10 / escalaCnt).toDecimal() / 10` — multiplica por 10 antes de dividir para obtener 1 decimal (Deluge no tiene float nativo).

## Notas / Bugs conocidos

- El parámetro `int encuestaId` no se creó automáticamente con la función — necesitó añadirse manualmente en la definición del código en el App IDE.
- `containsKey()` usado en la lógica de agregación — reemplazado por `get()!=null` para la versión inyectada en App IDE.
- Si la encuesta no existe, retorna error HTML inline con el ID recibido (para debugging).
- Las barras de escala se renderizan de 5 a 1 (descendente) para que la mejor puntuación quede arriba.
