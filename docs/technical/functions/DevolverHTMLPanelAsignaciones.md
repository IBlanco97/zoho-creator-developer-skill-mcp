# DevolverHTMLPanelAsignaciones

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLPanelAsignaciones` |
| **functionId** | `4790826000001031061` |
| **Tipo** | HTML Page |
| **Página asociada** | `Panel_de_Asignaciones` (componentId: `4790826000001031069`) |
| **Roles con acceso** | Gestor RRHH, RESPONSABLE CAE, SUPER ADM, SUPERVISOR, OPERARIO CAE |
| **Backup local** | `deluge-drafts/DevolverHTMLPanelAsignaciones.deluge` |

## Qué hace

Vista centralizada de asignaciones técnico-cliente. Muestra 4 KPIs, filtros CSS-only (Todos/Con Problemas/Todo OK/Sin Técnicos), tarjetas por cliente con avatares de técnico. Inputs de búsqueda "Buscar cliente" + "Buscar técnico" (añadidos 2026-04-05).

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `tecFilter` | string | Filtro por técnico (puede ser "null") |
| `cliFilter` | string | Filtro por cliente (puede ser "null") |

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Asignacion_T_cnico_Cliente` | `Estado != "Finalizada" && Tipo_de_Asignacion == "Cliente"` | `Cliente` (lookup), `Tecnico` (lookup → Nombre), `Estado`, `Dias_Laborales`, `Turnos` (subform) |
| `Nuevo_Cliente` | Via dot notation | `Nombre_de_Cuenta` |
| `Nuevo_Empleado` | Via dot notation | `Nombre.first_name`, `Nombre.last_name` |

## Estructura HTML generada

```
Header gradiente #1C3A5E con título + inputs búsqueda
├── 4 KPIs (Asignaciones Activas, Técnicos Únicos, Clientes, Problemas)
├── Filtros CSS-only (radio buttons)
└── Grid de cards por cliente
    └── Card por cliente
        ├── Nombre cliente + badge estado
        ├── Avatares circulares de técnicos asignados (color determinístico por inicial)
        └── Info: días laborales abreviados (LMXJVSD), primer turno
```

**Pre-agregación**: Usa `Map()` para agrupar asignaciones por cliente en un solo pass — O(n) en vez de queries anidadas.

**Colores de avatar determinísticos**: Basados en la primera letra del nombre — 5 colores fijos asignados por rangos de letras.

## Notas / Bugs conocidos

- Bug CSS corregido: el IDE guardó `class=\'pa\'` (backslash) → DOM recibía `class="'pa'"` → ningún selector matcheaba. Fix: reinyección desde backup con comillas planas.
- **SIEMPRE** escribir `class='pa'` (comillas planas) en strings Deluge.
- Filtros normalizan `"null"` string a `""` — Zoho pasa variables de página no definidas como el string literal "null".
