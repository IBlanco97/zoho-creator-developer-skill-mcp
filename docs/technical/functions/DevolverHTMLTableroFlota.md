# DevolverHTMLTableroFlota

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLTableroFlota` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Tablero_Flota` |
| **Roles con acceso** | Roles RRHH admin |
| **Backup local** | `deluge-drafts/DevolverHTMLTableroFlota.deluge` |

## Qué hace

Genera el tablero de gestión de flota con 4 KPIs (Total, Asignados, Sin Chofer, Archivados), filtros CSS-only (Todos/Asignados/Sin Chofer/Archivados) y tarjetas por vehículo con tabla de asignaciones activas.

## Parámetros

Sin parámetros.

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Veh_culo` | Todos | Matrícula, tipo, estado asignación, chofer |

## Estructura HTML generada

```
.wrap (max-width 1400px)
├── .hdr (header #1C3A5E)
├── .kg (grid 4 KPIs: Total, Asignados, Sin Chofer, Archivados)
├── .flt (filtros CSS-only con radio inputs)
└── .cards (grid de tarjetas por vehículo)
    └── .cd (card, clases condicionales is-asig/is-libre/is-arch)
```

**Filtros CSS-only**: Mismo patrón que el resto de la app — `#f0:checked~.wrap .cards .cd:not(.is-asig){display:none}`.

## Notas / Bugs conocidos

- CSS construido como string estático al inicio de la función (no intercalado con datos).
