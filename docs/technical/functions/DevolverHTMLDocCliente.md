# DevolverHTMLDocCliente

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLDocCliente` |
| **functionId** | `4790826000001028043` |
| **Tipo** | HTML Page |
| **Página asociada** | `Documentaci_n_del_Cliente` |
| **Roles con acceso** | Roles RRHH |
| **Backup local** | `deluge-drafts/DevolverHTMLDocCliente.deluge` |

## Qué hace

Genera la vista detallada de documentación de un cliente específico. Muestra 6 KPIs color-coded, 2 semáforos (Caducidad + Envío), barra de progreso, y tablas agrupadas por tipo (Empresa + Trabajador sub-agrupado por nombre).

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `clienteId` | int | ID del cliente. Se pasa via variable de página `ClienteID` |

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Cliente` | `ID == clienteId.toLong()` | `Nombre_de_Cuenta` |
| Documentos del cliente | Filtrado por cliente | `Estado`, `Plantilla.Nombre_de_la_plantilla`, `Caducidad_Tolerancia`, `Documento`, `Con_Empresa_o_Con_Trabajador`, `Trabajador` |

## Notas / Bugs conocidos

- `clienteId.toLong()` obligatorio en queries — el parámetro llega como int pero las queries de ID necesitan long.
- `d.Documento != null` se evalúa como flag int (bigint) — no como string.
- `d.Plantilla != null` guard obligatorio antes de `.Nombre_de_la_plantilla`.
- `d.Caducidad_Tolerancia != null` guard obligatorio antes de `.toString()`.
- API de actualización: `populateCustomFunction` con `scripttype=workflowmodify` + `functionid`.
