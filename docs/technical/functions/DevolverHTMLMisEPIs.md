# DevolverHTMLMisEPIs

## Datos generales

| Campo | Valor |
|-------|-------|
| **Nombre completo** | `Calendario52HTML.DevolverHTMLMisEPIs` |
| **functionId** | `4790826000001026043` |
| **Tipo** | HTML Page |
| **Página asociada** | `Mis_EPIs` |
| **Roles con acceso** | USUARIO TRABAJADOR |
| **Backup local** | No disponible (inyectado directamente) |

## Qué hace

Genera la página "Mis EPIs" para el empleado logueado. Muestra una tabla con todos los EPIs, ropa y herramientas asignados, con badges de tipo (EPI=azul, ROPA=morado, HERRAMIENTA=verde) y estado (Entregado/Confirmado=verde, Rechazado=rojo, Aprobado/Gestionándose=naranja, resto=gris). Incluye botón para nueva solicitud.

## Parámetros

Sin parámetros (usa `zoho.loginuserid`).

## Formularios que consulta

| Formulario | Query | Campos usados |
|-----------|-------|---------------|
| `Nuevo_Empleado` | `Official_Email == uid \|\| Mail_Portal_Empleado == uid \|\| Correo_Electr_nico == uid` | `ID`, `Nombre` |
| Formulario de EPIs/Herramientas | Filtrado por empleado | Tipo, Estado, nombre, cantidades |

## Formularios que modifica

Ninguno.

## Estructura HTML generada

```
Header gradiente #1C3A5E con avatar + nombre empleado
├── Tabla de EPIs asignados
│   ├── Badges tipo: EPI (azul), ROPA (morado), HERRAMIENTA (verde)
│   └── Badges estado: Entregado/Confirmado (verde), Rechazado (rojo), 
│       Aprobado/Gestionándose (naranja), resto (gris)
└── Botón "+ Nueva Solicitud" → #Form:Solicitud_de_EPIs_Herramientas
```

## Notas / Bugs conocidos

- Usa patrón `cnt_` counter en vez de `.size()` para contar registros — evita problemas con empty set en Deluge.
- Empty state si no tiene EPIs asignados.
