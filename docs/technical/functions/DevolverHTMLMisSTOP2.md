# DevolverHTMLMisSTOP2

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLMisSTOP2` |
| **functionId** | `4790826000001053735` |
| **Tipo** | HTML Page |
| **Página asociada** | `Mis_STOP2` (componentId: `4790826000001053747`) |
| **Roles con acceso** | Todos (6 roles) |
| **Backup local** | `deluge-drafts/DevolverHTMLMisSTOP2.deluge` |

## Qué hace

Genera la página HTML "Mis Checklists STOP2" para el empleado logueado. Muestra un header con avatar e iniciales, 3 KPIs (total realizados, este mes, con alertas críticas), botón para crear nuevo STOP2, y tarjetas por cada checklist realizado con resumen por sección y badge de estado.

## Parámetros

Sin parámetros (usa `zoho.loginuserid` para identificar al empleado).

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Empleado` | `Official_Email == uid \|\| Mail_Portal_Empleado == uid \|\| Correo_Electr_nico == uid` | `ID`, `Nombre.first_name`, `Nombre.last_name` |
| `STOP2_Analisis_Previo` | `Empleado == empId` (sort by `Fecha_Checklist desc`) | `Fecha_Checklist`, `Cliente` (lookup → `.Nombre_de_Cuenta`), `Orden_de_Trabajo`, `Observaciones`, 22 Decision Box |

## Formularios que modifica

Ninguno (solo lectura).

## Estructura HTML generada

```
.ms (contenedor principal, fondo #f0f2f5)
├── .hd (header gradiente #1C3A5E → #2d5a8e)
│   ├── .av (avatar circular con iniciales)
│   └── .hn + .hs (nombre + subtítulo)
├── .kr (grid 3 columnas KPIs)
│   ├── .kc (Total realizados)
│   ├── .kc (Este mes)
│   └── .kc.kw (Con alertas críticas — rojo si > 0)
├── .tb (toolbar: botón "+ Nuevo STOP2" → #Form:STOP2_Analisis_Previo + botón "Manual Técnicos" → #Page:Enviar_Manual_STOP2_Tecnicos)
└── .ct (contenedor de cards)
    └── .cd (card por registro, .cw si tiene alertas)
        ├── .ch (header: nombre cliente + badge OK/alertas)
        ├── .cm (meta: fecha, OT)
        ├── .sb (grid 5 columnas: Acceso x/7, Entorno x/4, Personal x/4, Materiales x/4, Final x/3)
        └── .co (observaciones, si hay)
```

**Campos críticos (alertas):** A4, A5, A6, A7 — si `== false`, suman al contador de alertas. Una card con ≥1 alerta recibe borde rojo izquierdo (`.cw`) y badge rojo.

**Conteo por sección:**
- Acceso: 7 campos (A1–A7)
- Entorno: 4 campos (E1–E4)
- Personal: 4 campos (P1–P4)
- Materiales: 4 campos (M1–M4)
- Final: 3 campos (F1–F3)

**KPI "Este mes":** Filtra por `Fecha_Checklist >= "{yyyy-MM}-01".toDate()`.

## Notas / Bugs conocidos

- Usa patrón estándar de identificación de empleado (triple OR en email fields + counter guard `empFound`).
- CSS responsive: en `≤768px` los KPIs pasan a 1 columna y las barras de sección a 3 columnas.
- El conteo total de SIs por sección se hace campo a campo (no hay forma de sumar Decision Box en batch en Deluge).
- Empty state: si `cntTotal == 0`, muestra SVG checkmark + mensaje "No has realizado ningún checklist STOP2 aún".
- (2026-08-02) Se eliminó el botón "Manual Supervisión" de la toolbar — este portal es principalmente para USUARIO TRABAJADOR, no debe ofrecerse el manual de supervisión. Solo queda "Manual Técnicos". Ver [[stop2-manuales-envio-correo]] en memoria del proyecto.
