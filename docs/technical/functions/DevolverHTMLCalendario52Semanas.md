# DevolverHTMLCalendario52Semanas

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLCalendario52Semanas` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Semanas_Nuevo` |
| **Roles con acceso** | Roles RRHH |

## Qué hace

Genera un calendario visual de 52 semanas del año. Cada celda muestra el número de semana y al hacer hover un tooltip CSS con `S{n} | {fecha_inicio} - {fecha_fin}` y opcionalmente `| {Tipo}` si la semana está asignada. Al hacer click navega a `#Page:Detalle_Semana?Anio={anio}&Semana={wn}`.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `anio` | int | Año a mostrar |

## Formularios que consulta

Consulta registros de semanas/asignaciones para el año indicado.

## Estructura HTML generada

```
Calendario grid 52 celdas
├── Cada celda: número de semana
│   ├── data-t attribute con tooltip (S{n} | fechas | tipo)
│   ├── CSS ::before content:attr(data-t) para tooltip hover
│   └── Click → #Page:Detalle_Semana?Anio={anio}&Semana={wn}
```

**Puro Deluge, sin JavaScript**: Zoho elimina `<script>` tags — los tooltips usan CSS puro (`::before` + `content:attr(data-t)`).

**Lista `dates` pre-computada**: Se calcula en el loop header y se reutiliza en el loop body para evitar recalcular fechas.

## Notas / Bugs conocidos

- Filtro de empleado + semana actual añadido en Sprint mejoras UX (A3).
