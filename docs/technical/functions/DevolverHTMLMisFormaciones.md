# DevolverHTMLMisFormaciones

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLMisFormaciones` |
| **functionId** | `4790826000001047011` |
| **Tipo** | HTML Page |
| **Página asociada** | `Mis_Formaciones` (componentId: `4790826000001047026`) |
| **Roles con acceso** | USUARIO TRABAJADOR |
| **Backup local** | `deluge-drafts/DevolverHTMLMisFormaciones.deluge` |

## Qué hace

Genera la página "Mis Formaciones" para el empleado logueado. Dos secciones: (1) Próximas formaciones convocadas en cards con fecha, duración y centro formativo, (2) Historial de formaciones pasadas en tabla (máx. 10 filas).

## Parámetros

Sin parámetros (usa `zoho.loginuserid`).

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Empleado` | `Official_Email == uid \|\| Mail_Portal_Empleado == uid \|\| Correo_Electr_nico == uid` | `ID`, `Nombre.first_name`, `Nombre.last_name`, `Area_Profesional` |
| `Formaci_n` | `Fecha_de_Comienzo >= hoy` (próximas) / `Fecha_de_Comienzo < hoy` (historial) | `T_tulo`, `Fecha_de_Comienzo`, `Fecha_de_Fin`, `Duraci_n`, `Centro_Formativo` (lookup), `Sede_Centro_Formativo` (lookup), `T_cnicos_a_convocar` (lookup list) |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
.mf (contenedor principal)
├── .hdr (header gradiente #1C3A5E con avatar + nombre + área profesional)
└── .cnt
    ├── .sc "Próximas Formaciones"
    │   └── .cards (grid auto-fill, min 260px)
    │       └── .fc (card por formación)
    │           ├── .fh (badge "Próxima" azul + título)
    │           └── .fm (meta: fecha, duración, centro/sede con SVG icons)
    └── .sc "Historial ({n})"
        └── .ht (tabla 5 columnas: Estado, Formación, Fecha, Dur, Centro)
            └── Max 10 filas (badge "Finalizada" gris)
```

**Membership check en lookup list:** `T_cnicos_a_convocar contains empId` NO funciona para lookup lists en Deluge. Fix: iterar `for each tid in f.T_cnicos_a_convocar` y comparar `if(tid == empId)` manualmente.

**Lookup picklist campos:** `Centro_Formativo` y `Sede_Centro_Formativo` son picklist lookups (IDs numéricos). `ifnull(f.Campo, "")` falla porque el campo es numérico. Fix: `cenId_ = ifnull(f.Campo, 0); cen_ = if(cenId_ != 0, ifnull(f.Campo.Nombre_del_Centro, ""), "")`.

## Notas / Bugs conocidos

- Historial limitado a 10 filas para rendimiento, pero muestra el total en el título.
- Responsive: en ≤768px, columnas Dur. y Centro se ocultan en la tabla de historial.
- Dos queries separadas (próximas vs pasadas) porque Deluge no soporta ORDER DESC + LIMIT en la misma query de forma combinada.
