# DevolverHTMLClientesDoc

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLClientesDoc` |
| **functionId** | `4790826000001031003` |
| **Tipo** | HTML Page |
| **Página asociada** | `Clientes_Doc` (componentId: `4790826000001031011`) + embebido en `Tablero_PRL` |
| **Roles con acceso** | Roles RRHH |
| **Backup local** | `deluge-drafts/DevolverHTMLClientesDoc.deluge` |

## Qué hace

Genera un grid de cards color-coded, una por cliente, con 8 KPIs de documentación (Total, P.Subir, Actual., Cad., Prox., No Env., Env., Valid.) y filtros CSS-only (Todos, Con Docs, Con Problemas, Caducados, Validados). Botones "Ver Docs" y "Enviar"/"Validar" condicionales.

## Parámetros

Sin parámetros.

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Cliente` | `Nombre_de_Cuenta != ""` | `ID`, `Nombre_de_Cuenta`, `CIF`, `Tel_fono`, 8 campos `Contador*` |

## Estructura HTML generada

```
.cdp (contenedor)
├── Radio inputs ocultos (f0-f4) para filtros CSS-only
├── .stats (5 KPIs: Total Clientes, Con Docs, Con Problemas, Caducados, Validados)
├── .fb (filtros: labels clicables)
└── .cards (grid auto-fill 300px)
    └── .card (card por cliente, clase st-r/st-o/st-g/st-x según estado)
        ├── .c-head (nombre + badge estado)
        ├── .c-meta (CIF + teléfono)
        ├── .c-kpis (8 mini-KPIs con colores por umbral)
        └── .c-act (botones: Ver Docs → #Page:Documentaci_n_del_Cliente?ClienteID={id})
```

## Notas / Bugs conocidos

- También embebido como snippet `Clientes_Doc_Html2` (htmlViewId: `4790826000001031053`) en `Tablero_PRL` (row 6).
- Patrón crítico para embed: `storeFunction` con `scripttype=htmlpageadd` + `updateTemplateContent` con `newElemType=html_snippet` en la misma sesión de browser.
- 122 clientes, 139 cards en producción.
