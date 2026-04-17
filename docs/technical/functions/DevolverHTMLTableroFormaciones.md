# DevolverHTMLTableroFormaciones

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLTableroFormaciones` |
| **functionId** | `4790826000001047002` |
| **Tipo** | HTML Page |
| **Página asociada** | `Tablero_Formaciones` (componentId: `4790826000001047015`, snippet htmlViewId: `4790826000001047022`) |
| **Roles con acceso** | Gestor RRHH, SUPER ADM, SUPERVISOR |
| **Backup local** | `deluge-drafts/DevolverHTMLTableroFormaciones.deluge` |

## Qué hace

Genera el tablero de formaciones con 4 KPIs (Total año, Próximas 30 días, Técnicos convocados, Inversión año), filtros CSS-only (Todas/Próximas/Pasadas) y cards con avatares de técnicos convocados.

## Parámetros

Sin parámetros.

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Formaci_n` | `ID != 0` (single pass) | `T_tulo`, `Fecha_de_Comienzo`, `Fecha_de_Fin`, `Duraci_n`, `Precio`, `Centro_Formativo` (lookup picklist), `Sede_Centro_Formativo` (lookup picklist), `T_cnicos_a_convocar` (lookup list) |

## Estructura HTML generada

```
Header gradiente #1C3A5E
├── 4 KPIs
├── Filtros CSS-only (Todas/Próximas/Pasadas)
└── Cards por formación
    ├── Título + badge (Próxima/Finalizada)
    ├── Fecha, duración, centro/sede
    └── Avatares circulares de técnicos convocados
```

**Single pass**: KPIs y cards se generan en un solo loop sobre `Formaci_n[ID != 0]` — O(n).

## Notas / Bugs conocidos

- `Centro_Formativo` y `Sede_Centro_Formativo` son picklist lookup (IDs numéricos). `ifnull(f.Campo, "")` falla porque el campo es numérico. Fix: `cenId_ = ifnull(f.Campo, 0); cen_ = if(cenId_ != 0, ifnull(f.Campo.Nombre_del_Centro, ""), "")`.
- NO roles RESPONSABLE CAE ni OPERARIO CAE tienen acceso.
