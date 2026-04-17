# DevolverHTMLSemaforoCaducidades

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLSemaforoCaducidades` |
| **functionId** | — |
| **Tipo** | HTML Page |
| **Página asociada** | `Sem_foro_Caducidades_EPI` (componentId: `4790826000001006621`) |
| **Roles con acceso** | Gestor RRHH |
| **Backup local** | `deluge-drafts/DevolverHTMLSemaforoCaducidades.deluge` |

## Qué hace

Genera una tabla semáforo de caducidades EPI/documentación para todos los técnicos. Cada fila es un técnico, y las columnas muestran pills coloreadas por documento con su estado de caducidad. 562 pills renderizadas en producción.

## Parámetros

Sin parámetros.

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Requisitos_Doc` | `Con_Empresa_o_Con_Trabajador == "Requisitos de Trabajador"` (sort by Trabajador asc) | `Trabajador` (lookup), `Estado`, `Plantilla.Nombre_de_la_plantilla`, `Caducidad_Tolerancia` |

## Estructura HTML generada

```
.sc-wrap
├── .sc-title "Semáforo de Caducidades EPI / Documentación"
├── .sc-table (2 columnas: Técnico | Documentos)
│   └── Filas agrupadas por técnico (detección de cambio de ID)
│       └── .sc-pill (pills coloreadas por estado)
│           ├── Rojo (#EF5350): Caducado
│           ├── Naranja: Próximo a caducar
│           ├── Verde: Actualizado
│           └── Gris (#9E9E9E): Sin estado
└── .sc-legend (leyenda de colores)
```

**Optimización**: Variables intermedias (`est`, `bg`, `nom`, `cad`, `tip`) eliminadas del bucle → inline con `if()` ternarios → ~3 stmts/iter en vez de ~18. Esto fue necesario porque Deluge tiene límite de statements por ejecución.

## Notas / Bugs conocidos

- Agrupa por técnico detectando cambio de ID (`lastId != wId`) — patrón "group by" manual en Deluge (no tiene GROUP BY nativo).
- Alterna colores de fila (odd/even) para legibilidad.
