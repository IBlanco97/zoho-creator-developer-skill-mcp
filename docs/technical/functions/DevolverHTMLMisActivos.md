# DevolverHTMLMisActivos

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLMisActivos` |
| **functionId** | — (no registrado) |
| **Tipo** | HTML Page |
| **Página asociada** | `Mis_Activos` (componentId: `4790826000001028147`) |
| **Roles con acceso** | USUARIO TRABAJADOR (profileId: `4790826000000171117`) |
| **Backup local** | No disponible |

## Qué hace

Genera la página "Mis Activos" para el empleado logueado. Muestra los activos con `Estado=="Activa"` filtrados por `Trabajador.Mail_Portal_Empleado == zoho.loginuserid`. Incluye badges de tipo (EPI=azul, ROPA=morado, HERRAMIENTA=verde), unidades, serie y fecha desde. Botón para solicitar nuevo EPI/herramienta.

## Parámetros

Sin parámetros (usa `zoho.loginuserid`).

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| Formulario de activos | `Estado == "Activa" && Trabajador.Mail_Portal_Empleado == zoho.loginuserid` | Tipo, Nombre, Unidades, Serie, Fecha_Desde, Estado |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
Header gradiente #1C3A5E
├── Cards/tabla de activos vigentes
│   ├── Badges tipo: EPI (azul), ROPA (morado), HERR (verde)
│   ├── Unidades, serie, fecha desde
│   └── Empty state si no hay activos
└── Botón "+ Solicitar EPI / Herramienta" → #Form:Solicitud_de_EPIs_Herramientas
```

## Notas / Bugs conocidos

- Página duplicada de `Inventario_EPI`.
- Filtro por `Trabajador.Mail_Portal_Empleado` (dot notation a través de lookup) — más directo que el patrón habitual de buscar empleado primero y luego filtrar por ID.
